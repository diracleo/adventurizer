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
import requests
import io
import os.path
import datetime as dt
from dateutil import parser
from os import path
from PIL import Image, ImageFont, ImageDraw
from botocore.exceptions import ClientError
from flask import Flask
from facepy import SignedRequest
from facepy import GraphAPI
from datetime import datetime, timedelta, date
from flask import Flask, json, g, request, jsonify, send_file
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from werkzeug.security import safe_str_cmp
from config import *
from util import *

class Account:
  def __init__(self, db):
    self.db = db

  def forgotPassword(self, email):
    users = self.db['user']
    ret = {}
    ret["status"] = "error"
    ret["errors"] = []

    if not email:
      ret["errors"].append({
        "code": "ErrEmptyEmail",
        "target": "email"
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    regPatt = '^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$'
    if not re.search(regPatt, email):
      ret["errors"].append({
        "code": "ErrInvalidEmail",
        "target": "email"
      })

    if ret["errors"]:
      return jsonifySafe(ret)
    
    user = users.find_one({"email": email})
    if user:
      tokens = {}
      if "tokens" in user:
        tokens = user["tokens"]
      
      newToken = randomString(20)
      tokens[newToken] = "resetPassword"

      actionToken = generateActionToken(str(user['_id']), newToken, "resetPassword")

      if not actionToken:
        ret["errors"].append({
          "code": "ErrUpdateFailed",
          "target": "email"
        })

      if ret["errors"]:
        return jsonifySafe(ret)

      updateRet = users.update_one({'_id': user['_id']},
      {
        '$set': {
          'tokens': tokens
        }
      }, upsert=True)

      if not updateRet:
        ret["errors"].append({
          "code": "ErrUpdateFailed",
          "target": "email"
        })

      if ret["errors"]:
        return jsonifySafe(ret)

      recipient = email
      subject = "Reset your password"

      contentText = """
        To reset your password, please click the following link:\r\n
        https://adventurizer.net/action/{actionToken}
        """.format(actionToken = actionToken)

      contentHTML = """
        <p>
          To reset your password, please click the following link:
          <br/><br/>
          <a href="https://adventurizer.net/action/{actionToken}">https://adventurizer.net/action/{actionToken}</a>
        </p>
        """.format(actionToken = actionToken)

      sendRet = sendEmail(self.db, recipient, subject, contentText, contentHTML)

      if not sendRet:
        ret["errors"].append({
          "code": "ErrEmailSending",
          "target": False
        })

      if ret["errors"]:
        return jsonifySafe(ret)
      
    ret["status"] = "success"

    return jsonifySafe(ret)

  def resendConfirmLink(self, email):
    users = self.db['user']
    ret = {}
    ret["status"] = "error"
    ret["errors"] = []

    if not email:
      ret["errors"].append({
        "code": "ErrEmptyEmail",
        "target": False
      })

    if ret["errors"]:
      return ret
    
    user = users.find_one({"email": email})

    finalToken = None
    if user and "tokens" in user:
      for token in user["tokens"]:
        if user["tokens"][token] == "confirmEmail":
          finalToken = token

    if finalToken:
      actionToken = generateActionToken(str(user['_id']), finalToken, "confirmEmail")
      if actionToken:
        setRet = sendConfirmAccountEmail(self.db, user['email'], user['penName'], actionToken)

    if ret["errors"]:
      return ret
    
    ret["status"] = "success"
    return ret

  def logout(self):
    ret = {}
    ret["status"] = "success"
    return ret

  def login(self, email, password):
    ret = {}
    ret["status"] = "error"
    ret["errors"] = []

    users = self.db['user']
    progress = self.db['progress']
    if not email:
      ret["errors"].append({
        "code": "ErrEmptyEmail",
        "target": "email"
      })
    if not password:
      ret["errors"].append({
        "code": "ErrEmptyPassword",
        "target": "password"
      })

    if ret["errors"]:
      return ret

    user = users.find_one({"email": email})

    if not user:
      ret["errors"].append({
        "code": "ErrInvalidCredentials",
        "target": False
      })

    if ret["errors"]:
      return ret

    if not user['confirmed']:
      ret["errors"].append({
        "code": "ErrAccountNotConfirmed",
        "target": False
      })
    
    if ret["errors"]:
      return ret

    salt = user['salt']
    key = user['key']
    newKey = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)

    if not safe_str_cmp(key, newKey):
      ret["errors"].append({
        "code": "ErrInvalidCredentials",
        "target": False
      })

    if ret["errors"]:
      return ret

    ret["status"] = "success"

    payload = {
      '_id': str(ObjectId(user['_id'])),
      'exp': datetime.utcnow() + timedelta(seconds=JWT_EXP_DELTA_SECONDS)
    }
    token = jwt.encode(payload, JWT_SECRET, JWT_ALGORITHM)

    # find progress by IP
    clientId = getClientIdentifier()

    tmp = list(progress.find({
      "$and": [
        {"clientId": clientId},
        {"userId": None}
      ]
    }))

    for a in tmp:
      o = a.copy()
      progressId = o['_id']
      o['userId'] = str(ObjectId(user['_id']))
      del o['_id']
      updateRet = progress.replace_one({"_id": progressId}, o, False)
      if not updateRet:
        ret["errors"].append({
          "code": "ErrUpdateFailed",
          "target": False
        })

    if ret["errors"]:
      return ret

    ret["data"] = {
      "accessToken": token.decode('utf-8')
    }

    return ret
  
  def loginExternal(self, externalType):
    ret = {}
    ret["status"] = "error"
    ret["errors"] = []

    users = self.db['user']
    progress = self.db['progress']
    if externalType == "facebook":
      signedRequestToken = request.json.get("signedRequest")
      data = SignedRequest.parse(signedRequestToken, FACEBOOK_APP["secret"])

      if not data or not "user_id" in data:
        ret["errors"].append({
          "code": "ErrInvalidCredentials",
          "target": False
        })

      if ret["errors"]:
        return ret
      
      externalId = request.json.get("externalId")

      if externalId != data['user_id']:
        ret["errors"].append({
          "code": "ErrInvalidCredentials",
          "target": False
        })

      if ret["errors"]:
        return ret
      
      accessToken = request.json.get("accessToken")

      if not accessToken:
        ret["errors"].append({
          "code": "ErrInvalidCredentials",
          "target": False
        })

      if ret["errors"]:
        return ret

      graph = GraphAPI(accessToken)

      if not graph:
        ret["errors"].append({
          "code": "ErrInvalidCredentials",
          "target": False
        })
      
      if ret["errors"]:
        return ret
      
      facebookUser = graph.get("me?fields=id,name,email")

      if not facebookUser or not "id" in facebookUser or not "name" in facebookUser or not "email" in facebookUser:
        ret["errors"].append({
          "code": "ErrInvalidCredentials",
          "target": False
        })
      
      if ret["errors"]:
        return ret
      
      if facebookUser['id'] != externalId:
        ret["errors"].append({
          "code": "ErrInvalidCredentials",
          "target": False
        })
      
      if ret["errors"]:
        return ret

      # okay, validation successful!

      user = users.find_one({
        "$and": [
          {"externalType": externalType},
          {"externalId": externalId}
        ]
      })

      if not user:
        exists = users.find_one({"email": email})
        if exists:
          ret["errors"].append({
            "code": "ErrExistsEmailDifferentMethod",
            "target": False
          })

        if ret["errors"]:
          return ret
        
        penName = facebookUser['name']

        user = {
          "email": email,
          "penName": penName,
          "externalType": externalType,
          "externalId": externalId,
          "confirmed": True,
          "confirmDate": datetime.utcnow(),
          "subscribed": True,
          "insertDate": datetime.utcnow()
        }

        userId = users.insert_one(user).inserted_id
        if not userId:
          ret["errors"].append({
            "code": "ErrInsertFailed",
            "target": False
          })

        if ret["errors"]:
          return ret

        user = users.find_one({"_id": ObjectId(userId)})

    else:
      ret["errors"].append({
        "code": "ErrInvalidCredentials",
        "target": False
      })
      return ret