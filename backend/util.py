# Dane Iracleous
# daneiracleous@gmail.com

import logging
import re
import hashlib
import os
import base64
import random
import string
import pymongo
import math
import jwt
import boto3
from botocore.exceptions import ClientError
from flask import Flask
from facepy import SignedRequest
from facepy import GraphAPI
from datetime import datetime, timedelta
from flask import Flask, json, g, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from werkzeug.security import safe_str_cmp
from config import *

def randomString(stringLength=10):
  letters = string.ascii_lowercase
  return ''.join(random.choice(letters) for i in range(stringLength))

def getClientIdentifier():
  parts = []
  if request.environ.get('HTTP_X_FORWARDED_FOR') is None:
    parts.append(request.environ['REMOTE_ADDR'])
  else:
    parts.append(request.environ['HTTP_X_FORWARDED_FOR'])

  # to-do: add more than just IP
  s = "_"
  s = s.join(parts)
  return s


def encryptPassword(password, salt):
  return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)


def authorize(accessToken):
  try:
    payload = jwt.decode(accessToken, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    if not payload['_id']:
      return False
    return payload['_id']
  except (jwt.DecodeError, jwt.ExpiredSignatureError):
    return False

def generateActionToken(userId, token, action, value = None):
  payload = {
    '_id': userId,
    'token': token,
    'action': action,
    'exp': datetime.utcnow() + timedelta(seconds=JWT_EXP_DELTA_SECONDS)
  }

  if value:
    payload['value'] = value

  actionToken = jwt.encode(payload, JWT_SECRET, JWT_ALGORITHM).decode('utf-8')
  return actionToken

def parseActionToken(actionToken):
  try:
    payload = jwt.decode(actionToken, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    if not payload['_id']:
      return False
    return payload
  except (jwt.DecodeError, jwt.ExpiredSignatureError):
    return False

def generateUnsubscribeToken(email):
  payload = {
    'email': email,
    'exp': datetime.utcnow() + timedelta(seconds=JWT_EXP_DELTA_SECONDS)
  }

  actionToken = jwt.encode(payload, JWT_SECRET, JWT_ALGORITHM).decode('utf-8')
  return actionToken

def parseUnsubscribeToken(actionToken):
  try:
    payload = jwt.decode(actionToken, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    if not payload['email']:
      return False
    return payload
  except (jwt.DecodeError, jwt.ExpiredSignatureError):
    return False

def jsonifySafe(json):
  return jsonify(json)

def sendEmail(db, recipient, subject, contentText, contentHTML):
  users = db["user"]
  nosends = db["nosend"]
  user = users.find_one({"email": recipient})
  if user and not user['subscribed']:
    return False
  else:
    nosend = nosends.find_one({"email": recipient})
    if nosend:
      return False

  SENDER = "Adventurizer <dane@adventurizer.net>"
  AWS_REGION = "us-west-2"            
  CHARSET = "UTF-8"
  client = boto3.client('ses', region_name=AWS_REGION)

  bodyText = contentText

  unsubLink = "https://adventurizer.net/settings"
  if not user or not user['confirmed']:
    unsubToken = generateUnsubscribeToken(recipient)
    unsubLink = "https://adventurizer.net/unsub/" + unsubToken

  bodyHTML = """<html>
    <head></head>
    <body style="background-color:#eee;">
      <div style="background-color:#eee; padding-top:15px; padding-bottom:15px;">
        <div style="max-width:600px; margin-left:auto; margin-right:auto; background-color:#fff; box-shadow:0px 5px 15px rgba(0, 0, 0, 0.1); border-radius:5px; overflow:hidden;">
          <div style="background-color:#673ab7; text-align:center; overflow:hidden;">
            <img src="https://s3-us-west-2.amazonaws.com/adventurizer.net/email/logo.png" alt="Adventurizer" />
          </div>
          <div style="padding:15px; border-bottom:1px solid #ccc;">{contentHTML}</div>
          <div style="padding:15px; text-align:center;">
            If you do not want to receive emails from Adventurizer, <a href="{unsubLink}">click here to unsubscribe</a>.<br/>
            <a href="https://adventurizer.net/terms">Terms of Use</a> &nbsp; <a href="https://adventurizer.net/privacy">Privacy Policy</a>
          </div>
        </div>
      </div>
    </body>
    </html>""".format(contentHTML = contentHTML, unsubLink = unsubLink)

  try:
    #Provide the contents of the email.
    response = client.send_email(
      Destination={
        'ToAddresses': [
          recipient,
        ],
      },
      Message={
        'Body': {
          'Html': {
            'Charset': CHARSET,
            'Data': bodyHTML,
          },
          'Text': {
            'Charset': CHARSET,
            'Data': bodyText,
          },
        },
        'Subject': {
          'Charset': CHARSET,
          'Data': subject,
        },
      },
      Source=SENDER,
    )
  # Display an error if something goes wrong.	
  except ClientError as e:
    print(e.response['Error']['Message'])
    return False
  else:
    return True

def sendWelcomeEmail(db, email, penName):
  recipient = email
  subject = "Welcome to Adventurizer!"

  contentText = """
    Welcome to Adventurizer
    """.format(penName = penName)

  contentHTML = """
    <h1>Welcome to Adventurizer, {penName}!</h1>
    <p>
      Adventurizer is currently in beta. Please keep checking back for the latest features.
    </p>
    """.format(penName = penName)

  sendRet = sendEmail(db, recipient, subject, contentText, contentHTML)

  return sendRet

def sendConfirmAccountEmail(db, email, penName, actionToken):
  recipient = email
  subject = "Confirm your account"

  contentText = """
    To confirm your account, please click the following link:\r\n
    https://adventurizer.net/action/{actionToken}
    """.format(actionToken = actionToken, penName = penName)

  contentHTML = """
    <h1>Thank you for signing up with Adventurizer, {penName}!</h1>
    <p>
      To confirm your account, please click the following link:
      <br/><br/>
      <a href="https://adventurizer.net/action/{actionToken}">https://adventurizer.net/action/{actionToken}</a>
    </p>
    """.format(actionToken = actionToken, penName = penName)

  sendRet = sendEmail(db, recipient, subject, contentText, contentHTML)

  return sendRet

def sendChangeAccountEmail(db, email, penName, actionToken):
  recipient = email
  subject = "Confirm your email address"

  contentText = """
    To confirm this email address, please click the following link:\r\n
    https://adventurizer.net/action/{actionToken}
    """.format(actionToken = actionToken, penName = penName)

  contentHTML = """
    <h1>You have changed your email address, {penName}!</h1>
    <p>
      To confirm this email address, please click the following link:
      <br/><br/>
      <a href="https://adventurizer.net/action/{actionToken}">https://adventurizer.net/action/{actionToken}</a>
    </p>
    """.format(actionToken = actionToken, penName = penName)

  sendRet = sendEmail(db, recipient, subject, contentText, contentHTML)

  return sendRet