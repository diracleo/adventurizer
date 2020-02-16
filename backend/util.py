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

def jsonifySafe(json):
  return jsonify(json)

def sendEmail(db, recipient, subject, contentText, contentHTML):
  users = db["user"]
  user = users.find_one({"email": recipient})
  if not user['subscribed']:
    return False

  SENDER = "Adventurizer <dane@adventurizer.net>"
  AWS_REGION = "us-west-2"            
  CHARSET = "UTF-8"
  client = boto3.client('ses', region_name=AWS_REGION)

  bodyText = contentText

  bodyHTML = """<html style="background-color:#eee;">
    <head></head>
    <body style="background-color:#eee;>
      <div style="background-color:#eee;>
        <div style="max-width:600px; margin-left:auto; margin-right:auto; background-color:#fff;">
          <div style="background-color:#673ab7; text-align:center; overflow:hidden; border-radius:5px;">
            <img src="https://s3-us-west-2.amazonaws.com/adventurizer.net/email/logo.png" alt="Adventurizer" />
          </div>
          <div style="padding-top:15px; padding-bottom:15px; border-bottom:1px solid #ccc;">"""
  
  bodyHTML += contentHTML

  bodyHTML += """
          </div>
          <div style="padding-top:15px; padding-bottom:15px;">
            If you do not want to receive emails from Adventurizer, <a href="https://adventurizer.net/settings">click here to unsubscribe</a>.<br/>
            <a href="https://adventurizer.net/terms">Terms of Use</a> &nbsp; <a href="https://adventurizer.net/privacy">Privacy Policy</a>
          </div>
        </div>
      </div>
    </body>
    </html>"""

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