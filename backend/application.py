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
from os import path
from PIL import Image, ImageFont, ImageDraw
from botocore.exceptions import ClientError
from flask import Flask
from facepy import SignedRequest
from facepy import GraphAPI
from datetime import datetime, timedelta
from flask import Flask, json, g, request, jsonify, send_file
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from werkzeug.security import safe_str_cmp
from config import *
from util import *

application = Flask(__name__)

mongo = MongoClient(DB_PATH)
db = mongo["adventurizer"]

CORS(application, resources={r"/*": {"origins": ACCEPTED_ORIGINS}})

@application.route("/emailReport", methods=["GET", "POST"])
def emailReport():
  try:
    js = json.loads(request.data)
  except:
    pass

  hdr = request.headers.get('X-Amz-Sns-Message-Type')
  if hdr == 'SubscriptionConfirmation' and 'SubscribeURL' in js:
    r = requests.get(js['SubscribeURL'])

  if hdr == 'Notification':
    processSNSMessage(db, js)

  return 'OK\n'

@application.route("/login", methods=["POST"])
def login():
  ret = {}
  ret["status"] = "error"
  ret["errors"] = []
  users = db["user"]
  progress = db['progress']
  email = request.json.get("email")
  password = request.json.get("password")
  externalType = request.json.get("externalType")

  if externalType:
    # external login
    if externalType == "facebook":
      signedRequestToken = request.json.get("signedRequest")
      data = SignedRequest.parse(signedRequestToken, FACEBOOK_APP["secret"])

      if not data or not "user_id" in data:
        ret["errors"].append({
          "code": "ErrInvalidCredentials",
          "target": False
        })

      if ret["errors"]:
        return jsonifySafe(ret)
      
      externalId = request.json.get("externalId")

      if externalId != data['user_id']:
        ret["errors"].append({
          "code": "ErrInvalidCredentials",
          "target": False
        })

      if ret["errors"]:
        return jsonifySafe(ret)
      
      accessToken = request.json.get("accessToken")

      if not accessToken:
        ret["errors"].append({
          "code": "ErrInvalidCredentials",
          "target": False
        })

      if ret["errors"]:
        return jsonifySafe(ret)

      graph = GraphAPI(accessToken)

      if not graph:
        ret["errors"].append({
          "code": "ErrInvalidCredentials",
          "target": False
        })
      
      if ret["errors"]:
        return jsonifySafe(ret)
      
      facebookUser = graph.get("me?fields=id,name,email")

      if not facebookUser or not "id" in facebookUser or not "name" in facebookUser or not "email" in facebookUser:
        ret["errors"].append({
          "code": "ErrInvalidCredentials",
          "target": False
        })
      
      if ret["errors"]:
        return jsonifySafe(ret)
      
      if facebookUser['id'] != externalId:
        ret["errors"].append({
          "code": "ErrInvalidCredentials",
          "target": False
        })
      
      if ret["errors"]:
        return jsonifySafe(ret)

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
          return jsonifySafe(ret)
        
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
          return jsonifySafe(ret)

        user = users.find_one({"_id": ObjectId(userId)})

    else:
      ret["errors"].append({
        "code": "ErrInvalidCredentials",
        "target": False
      })
      return jsonifySafe(ret)

  else:
    # internal login
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
      return jsonifySafe(ret)

    user = users.find_one({"email": email})

    if not user:
      ret["errors"].append({
        "code": "ErrInvalidCredentials",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    if not user['confirmed']:
      ret["errors"].append({
        "code": "ErrAccountNotConfirmed",
        "target": False
      })
    
    if ret["errors"]:
      return jsonifySafe(ret)

    salt = user['salt']
    key = user['key']
    newKey = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)

    if not safe_str_cmp(key, newKey):
      ret["errors"].append({
        "code": "ErrInvalidCredentials",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

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
    return jsonifySafe(ret)

  ret["data"] = {
    "accessToken": token.decode('utf-8')
  }
  return jsonifySafe(ret)


@application.route("/logout", methods=["GET", "POST"])
def logout():
  ret = {}
  ret["status"] = "success"
  return jsonifySafe(ret)

@application.route("/resendConfirmLink", methods=["POST"])
def resendConfirmLink():
  ret = {}
  ret["status"] = "error"
  ret["errors"] = []
  users = db['user']

  email = request.json.get("email")

  if not email:
    ret["errors"].append({
      "code": "ErrEmptyEmail",
      "target": False
    })

  if ret["errors"]:
    return jsonifySafe(ret)
  
  user = users.find_one({"email": email})

  finalToken = None
  if user and "tokens" in user:
    for token in user["tokens"]:
      if user["tokens"][token] == "confirmEmail":
        finalToken = token

  if finalToken:
    actionToken = generateActionToken(str(user['_id']), finalToken, "confirmEmail")
    if actionToken:
      setRet = sendConfirmAccountEmail(db, user['email'], user['penName'], actionToken)

  if ret["errors"]:
    return jsonifySafe(ret)
  
  ret["status"] = "success"
  return jsonifySafe(ret)

@application.route("/forgotPassword", methods=["POST"])
def forgotPassword():
  ret = {}
  ret["status"] = "error"
  ret["errors"] = []
  users = db['user']

  email = request.json.get("email")

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

    sendRet = sendEmail(db, recipient, subject, contentText, contentHTML)

    if not sendRet:
      ret["errors"].append({
        "code": "ErrEmailSending",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)
    
  ret["status"] = "success"

  return jsonifySafe(ret)

@application.route("/unsub/<unsubToken>", methods=["GET", "POST"])
def unsub(unsubToken):
  ret = {}
  ret["status"] = "error"
  ret["errors"] = []
  nosends = db['nosend']

  response = parseUnsubscribeToken(unsubToken)

  if not response or not "email" in response:
    ret["errors"].append({
      "code": "ErrServerResponse",
      "target": False
    })

  if ret["errors"]:
    return jsonifySafe(ret)
  
  email = response['email']

  nosend = nosends.find_one({"email": email})

  subscribed = True
  if nosend:
    subscribed = False
  
  ret["data"] = {
    "email": email,
    "subscribed": subscribed
  }

  if request.method == "GET":
    ret["status"] = "success"
    return jsonifySafe(ret)
  elif request.method == "POST":
    newSubscribed = request.json.get("subscribed")
    if not newSubscribed and subscribed:
      insertRet = nosends.insert_one({"email": email})
      if not insertRet:
        ret["errors"].append({
          "code": "ErrServerResponse",
          "target": False
        })
        if ret["errors"]:
          return jsonifySafe(ret)
    elif newSubscribed and not subscribed:
      deleteRet = nosends.delete_one({"email": email})
      if not deleteRet:
        ret["errors"].append({
          "code": "ErrServerResponse",
          "target": False
        })
        if ret["errors"]:
          return jsonifySafe(ret)
    
    ret["data"]["subscribed"] = newSubscribed
    ret["status"] = "success"
    return jsonifySafe(ret)

@application.route("/action/<actionToken>", methods=["GET", "POST"])
def actionUser(actionToken):
  ret = {}
  ret["status"] = "error"
  ret["errors"] = []
  users = db['user']

  response = parseActionToken(actionToken)

  if not response or not "action" in response or not "token" in response:
    ret["errors"].append({
      "code": "ErrServerResponse",
      "target": False
    })

  if ret["errors"]:
    return jsonifySafe(ret)
  
  userId = response['_id']
  user = users.find_one({"_id": ObjectId(userId)})
  if not user:
    ret["errors"].append({
      "code": "ErrServerResponse",
      "target": False
    })
  
  if ret["errors"]:
    return jsonifySafe(ret)
  
  token = response["token"]
  action = response["action"]
  value = None
  if "value" in response:
    value = response["value"]

  if not "tokens" in user or not token in user['tokens'] or user['tokens'][token] != action:
    ret["errors"].append({
      "code": "ErrServerResponse",
      "target": False
    })

  if ret["errors"]:
    return jsonifySafe(ret)

  if request.method == "GET":
    if action == "confirmEmail":
      # confirming email requires just a quick visit to this endpoint - no need to POST after
      tokens = user['tokens'].copy()
      del tokens[token]

      updateRet = users.update_one({'_id': user['_id']},
      {
        '$set': {
          'confirmed': True,
          'confirmDate': datetime.utcnow(),
          'tokens': tokens
        }
      }, upsert=True)

      if not updateRet:
        ret["errors"].append({
          "code": "ErrUpdateFailed",
          "target": False
        })
      
      sendRet = sendWelcomeEmail(db, user['email'], user['penName'])

      if ret["errors"]:
        return jsonifySafe(ret)
    elif action == "changeEmail":
      tokens = user['tokens'].copy()
      del tokens[token]

      # check if email already taken
      exists = users.find_one({"email": value})
      if exists:
        ret["errors"].append({
          "code": "ErrExistsEmail",
          "target": "email"
        })

      if ret["errors"]:
        return jsonifySafe(ret)

      updateRet = users.update_one({'_id': user['_id']},
      {
        '$set': {
          'email': value,
          'tokens': tokens
        }
      }, upsert=True)

      if not updateRet:
        ret["errors"].append({
          "code": "ErrUpdateFailed",
          "target": False
        })

      if ret["errors"]:
        return jsonifySafe(ret)

    ret["status"] = "success"
    ret["data"] = {
      "token": actionToken,
      "action": response['action']
    }
    if value:
      ret["data"]["value"] = value

  elif request.method == "POST":
    if action == "resetPassword":
      password = request.json.get("password")
      passwordConfirm = request.json.get("passwordConfirm")

      if not password:
        ret["errors"].append({
          "code": "ErrEmptyPassword",
          "target": "password"
        })
      elif password != passwordConfirm:
        ret["errors"].append({
          "code": "ErrMatchPasswords",
          "target": "passwordConfirm"
        })

      if ret["errors"]:
        return jsonifySafe(ret)

      if len(password) < 6:
        ret["errors"].append({
          "code": "ErrInvalidPassword",
          "target": "password"
        })

      if ret["errors"]:
        return jsonifySafe(ret)
      
      salt = os.urandom(32)
      key = encryptPassword(password, salt)

      tokens = user['tokens'].copy()
      del tokens[token]

      updateRet = users.update_one({'_id': user['_id']},
      {
        '$set': {
          'salt': salt,
          'key': key,
          'tokens': tokens
        }
      }, upsert=True)

      if not updateRet:
        ret["errors"].append({
          "code": "ErrUpdateFailed",
          "target": False
        })

      if ret["errors"]:
        return jsonifySafe(ret)

    ret["status"] = "success"

  return jsonifySafe(ret)

@application.route("/me/password", methods=["PUT"])
def userPassword():
  ret = {}
  ret["status"] = "error"
  ret["errors"] = []
  users = db['user']  

  userId = None
  if request.headers.get('Authorization'):
    userId = authorize(request.headers.get('Authorization'))
  
  if not userId:
    ret["errors"].append({
      "code": "ErrNotAuthorized",
      "target": False
    })

  if ret["errors"]:
    return jsonifySafe(ret)
  
  user = users.find_one({"_id": ObjectId(userId)})
  if not user:
    ret["errors"].append({
      "code": "ErrNotFound",
      "target": False
    })
  
  if ret["errors"]:
    return jsonifySafe(ret)

  password = request.json.get("password")

  salt = user['salt']
  key = user['key']
  newKey = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)

  if not safe_str_cmp(key, newKey):
    ret["errors"].append({
      "code": "ErrInvalidCredentials",
      "target": False
    })

  if ret["errors"]:
    return jsonifySafe(ret)

  passwordNew = request.json.get("passwordNew")
  passwordNewConfirm = request.json.get("passwordNewConfirm")

  if not passwordNew:
    ret["errors"].append({
      "code": "ErrEmptyPassword",
      "target": "passwordNew"
    })
  elif passwordNew != passwordNewConfirm:
    ret["errors"].append({
      "code": "ErrMatchPasswords",
      "target": "passwordNewConfirm"
    })

  if ret["errors"]:
    return jsonifySafe(ret)
  
  if len(passwordNew) < 6:
    ret["errors"].append({
      "code": "ErrInvalidPassword",
      "target": "passwordNew"
    })

  if ret["errors"]:
    return jsonifySafe(ret)

  salt = os.urandom(32)
  key = encryptPassword(passwordNew, salt)

  updateRet = users.update_one({'_id': user['_id']},
  {
    '$set': {
      'salt': salt,
      'key': key
    }
  }, upsert=True)

  if not updateRet:
    ret["errors"].append({
      "code": "ErrUpdateFailed",
      "target": "email"
    })

  if ret["errors"]:
    return jsonifySafe(ret)

  ret["status"] = "success"
  return jsonifySafe(ret)

@application.route("/me/email", methods=["PUT"])
def userEmail():
  ret = {}
  ret["status"] = "error"
  ret["errors"] = []
  users = db['user']  

  userId = None
  if request.headers.get('Authorization'):
    userId = authorize(request.headers.get('Authorization'))
  
  if not userId:
    ret["errors"].append({
      "code": "ErrNotAuthorized",
      "target": False
    })

  if ret["errors"]:
    return jsonifySafe(ret)
  
  user = users.find_one({"_id": ObjectId(userId)})
  if not user:
    ret["errors"].append({
      "code": "ErrNotFound",
      "target": False
    })
  
  if ret["errors"]:
    return jsonifySafe(ret)

  password = request.json.get("password")

  salt = user['salt']
  key = user['key']
  newKey = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)

  if not safe_str_cmp(key, newKey):
    ret["errors"].append({
      "code": "ErrInvalidCredentials",
      "target": False
    })

  if ret["errors"]:
    return jsonifySafe(ret)

  emailNew = request.json.get("emailNew")
  emailNewConfirm = request.json.get("emailNewConfirm")

  if not emailNew:
    ret["errors"].append({
      "code": "ErrEmptyEmail",
      "target": "emailNew"
    })
  elif emailNew != emailNewConfirm:
    ret["errors"].append({
      "code": "ErrMatchEmails",
      "target": "emailNewConfirm"
    })

  if ret["errors"]:
    return jsonifySafe(ret)

  regPatt = '^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$'
  if not re.search(regPatt, emailNew):
    ret["errors"].append({
      "code": "ErrInvalidEmail",
      "target": "emailNew"
    })

  if ret["errors"]:
    return jsonifySafe(ret)

  if emailNew == user['email']:
    ret["errors"].append({
      "code": "ErrSameEmail",
      "target": "emailNew"
    })

  if ret["errors"]:
    return jsonifySafe(ret)
  
  tokens = {}
  if "tokens" in user:
    tokens = user["tokens"]
  
  newToken = randomString(20)
  tokens[newToken] = "changeEmail"

  actionToken = generateActionToken(str(user['_id']), newToken, "changeEmail", emailNew)

  if not actionToken:
    ret["errors"].append({
      "code": "ErrUpdateFailed",
      "target": "emailNew"
    })

  if ret["errors"]:
    return jsonifySafe(ret)

  # check if email already taken
  exists = users.find_one({"email": emailNew})
  if exists:
    ret["errors"].append({
      "code": "ErrExistsEmail",
      "target": "emailNew"
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

  sendRet = sendChangeAccountEmail(db, emailNew, user['penName'], actionToken)

  if not sendRet:
    ret["errors"].append({
      "code": "ErrEmailFailed",
      "target": "email"
    })

  if ret["errors"]:
    return jsonifySafe(ret)
  
  ret["status"] = "success"
  return jsonifySafe(ret)

@application.route("/me", methods=["GET", "POST", "PUT"])
def user():
  ret = {}
  ret["status"] = "error"
  ret["errors"] = []
  users = db['user']
  nosends = db['nosend']
  if request.method == "GET":
    # getting logged in user
    userId = None
    if request.headers.get('Authorization'):
      userId = authorize(request.headers.get('Authorization'))
    
    if not userId:
      ret["errors"].append({
        "code": "ErrNotAuthorized",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    user = users.find_one({"_id": ObjectId(userId)})
    if not user:
      ret["errors"].append({
        "code": "ErrNotFound",
        "target": False
      })
    
    if ret["errors"]:
      return jsonifySafe(ret)

    ret["status"] = "success"
    ret["data"] = {
      "user": {
        "penName": {
          "value": user["penName"],
          "error": None
        },
        "email": {
          "value": user["email"],
          "error": None
        },
        "subscribed": {
          "value": user["subscribed"],
          "error": None
        }
      }
    }
  elif request.method == "PUT":
    # updating logged in user
    userId = None
    if request.headers.get('Authorization'):
      userId = authorize(request.headers.get('Authorization'))
    
    if not userId:
      ret["errors"].append({
        "code": "ErrNotAuthorized",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    user = users.find_one({"_id": ObjectId(userId)})
    if not user:
      ret["errors"].append({
        "code": "ErrNotFound",
        "target": False
      })
    
    if ret["errors"]:
      return jsonifySafe(ret)
    
    penName = request.json.get("penName")
    subscribed = request.json.get("subscribed")

    userNew = user.copy()
    del userNew['_id']
    userNew['penName'] = penName
    userNew['subscribed'] = subscribed

    updateRet = users.update_one({'_id': ObjectId(userId)},
      {
        '$set': {
          'penName': penName,
          'subscribed': subscribed
        }
      }, upsert=True)

    if not updateRet:
      ret["errors"].append({
        "code": "ErrUpdateFailed",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)
    
    if subscribed:
      nosends.delete_one({"email": user['email']})

    ret["status"] = "success"

  elif request.method == "POST":
    # signing up as new user
    penName = request.json.get("penName")
    email = request.json.get("email")
    emailConfirm = request.json.get("emailConfirm")
    password = request.json.get("password")
    passwordConfirm = request.json.get("passwordConfirm")
    if not penName:
      ret["errors"].append({
        "code": "ErrEmptyPenName",
        "target": "penName"
      })
    if not email:
      ret["errors"].append({
        "code": "ErrEmptyEmail",
        "target": "email"
      })
    elif email != emailConfirm:
      ret["errors"].append({
        "code": "ErrMatchEmails",
        "target": "emailConfirm"
      })
    if not password:
      ret["errors"].append({
        "code": "ErrEmptyPassword",
        "target": "password"
      })
    elif password != passwordConfirm:
      ret["errors"].append({
        "code": "ErrMatchPasswords",
        "target": "passwordConfirm"
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    regPatt = '^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$'
    if not re.search(regPatt, email):
      ret["errors"].append({
        "code": "ErrInvalidEmail",
        "target": "email"
      })
    if len(password) < 6:
      ret["errors"].append({
        "code": "ErrInvalidPassword",
        "target": "password"
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    exists = users.find_one({"email": email})
    if exists:
      ret["errors"].append({
        "code": "ErrExistsEmail",
        "target": "email"
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    salt = os.urandom(32)
    key = encryptPassword(password, salt)

    user = {
      "email": email,
      "penName": penName,
      "salt": salt,
      "key": key,
      "confirmed": False,
      "subscribed": True,
      "permissions": {
        "createAdventures": True,
        "viewAdventures": True
      },
      "tokens": {},
      "insertDate": datetime.utcnow()
    }
    userId = users.insert_one(user).inserted_id
    if not userId:
      ret["errors"].append({
        "code": "ErrInsertFailed",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    tokens = {}
    newToken = randomString(20)
    tokens[newToken] = "confirmEmail"

    actionToken = generateActionToken(str(userId), newToken, "confirmEmail")

    if not actionToken:
      ret["errors"].append({
        "code": "ErrUpdateFailed",
        "target": "email"
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    updateRet = users.update_one({'_id': userId},
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

    sendRet = sendConfirmAccountEmail(db, email, penName, actionToken)

    if not sendRet:
      ret["errors"].append({
        "code": "ErrEmailSending",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    ret["status"] = "success"

  return jsonifySafe(ret)


@application.route("/<who>/adventures/<adventureId>/progress/<progressId>", methods=["GET", "PUT"])
def adventureProgress(who, adventureId, progressId):
  ret = {}
  ret["status"] = "error"
  ret["errors"] = []

  if request.headers.get('Authorization'):
    userId = authorize(request.headers.get('Authorization'))
  else:
    userId = None

  if userId:
    userId = str(ObjectId(userId))

  clientId = getClientIdentifier()
  
  progress = db['progress']
  adventures = db['adventure']

  if request.method == "PUT":
    # update adventure progress
    prog = progress.find_one({"_id": ObjectId(progressId)})

    if not prog:
      ret["errors"].append({
        "code": "ErrNotFound",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    validated = False
    if not prog['userId']:
      if prog['clientId'] == clientId:
        validated = True
    else:
      if prog['userId'] == userId:
        validated = True

    if not validated:
      ret["errors"].append({
        "code": "ErrNotAuthorized",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    progData = request.json.get("progress")

    del progData['_id']

    updateRet = progress.replace_one({"_id": ObjectId(progressId)}, progData, False)

    if not updateRet:
      ret["errors"].append({
        "code": "ErrUpdateFailed",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    ret["data"] = {
      "progressId": progressId,
      "progress": progData
    }
    ret["status"] = "success"

  return jsonifySafe(ret)


@application.route("/<who>/adventures/<adventureId>/progress", methods=["GET", "POST"])
def adventureProgressNew(who, adventureId):
  ret = {}
  ret["status"] = "error"
  ret["errors"] = []

  if request.headers.get('Authorization'):
    userId = authorize(request.headers.get('Authorization'))
  else:
    userId = None

  if userId:
    userId = str(ObjectId(userId))

  clientId = getClientIdentifier()

  progress = db['progress']
  adventures = db['adventure']

  if request.method == "POST":
    # creating new adventure progress
    
    adv = adventures.find_one({"_id": ObjectId(adventureId)})
    if not adv:
      ret["errors"].append({
        "code": "ErrNotFound",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    current = None
    for k, v in adv['data'].items():
      if v['start']:
        current = k
        break

    if not current:
      ret["errors"].append({
        "code": "ErrNotFound",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    history = [
      {
        "questionId": None
      }
    ]

    history.append({
      "questionId": current
    })
    current = len(history) - 1

    prog = {
      "adventureId": adventureId,
      "userId": userId,
      "clientId": clientId,
      "history": history,
      "current": current,
      "insertDate": datetime.utcnow()
    }

    progressId = progress.insert_one(prog).inserted_id

    if not progressId:
      ret["errors"].append({
        "code": "ErrInsertFailed",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    prog['_id'] = str(prog['_id'])


    adventures.update_one({'_id': ObjectId(adventureId)},
    {
      '$inc': {
        'analytic.taken': 1
      },
      '$set': {
        'analytic.lastTakenDate': datetime.utcnow()
      }
    }, upsert=True)

    ret["data"] = {
      "progressId": str(ObjectId(progressId)),
      "progress": prog
    }
    ret["status"] = "success"

  elif request.method == "GET":
    # fetching list of all adventures
    tmp = list(adventures.find({"userId": userId}))
    adventuresList = []
    for a in tmp:
      t = {}
      t['_id'] = str(ObjectId(a['_id']))
      t['meta'] = a['meta']
      adventuresList.append(t)

    ret["status"] = "success"
    ret["data"] = {
      "adventures": adventuresList
    }

  return jsonifySafe(ret)

@application.route("/<who>/adventures/<adventureId>/meta", methods=["GET", "PUT"])
def adventureMeta(who, adventureId):
  ret = {}
  ret["status"] = "error"
  ret["errors"] = []

  userId = False

  if request.headers.get('Authorization'):
    userId = authorize(request.headers.get('Authorization'))

  if request.method == "PUT" or request.method == "DELETE":
    if not userId:
      ret["errors"].append({
        "code": "ErrNotAuthorized",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

  adventures = db['adventure']
  users = db['user']
  progress = db['progress']
  analytic = db['analytic']

  if request.method == "PUT":
    adv = adventures.find_one({"_id": ObjectId(adventureId)})
    if not adv:
      ret["errors"].append({
        "code": "ErrNotFound",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    if adv['userId'] != userId:
      ret["errors"].append({
        "code": "ErrNotAuthorized",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    meta = request.json.get("meta")

    if not meta['title']:
      ret["errors"].append({
        "code": "ErrEmptyAdventureTitle",
        "target": "title"
      })
    
    if not meta['state']:
      ret["errors"].append({
        "code": "ErrEmptyAdventureState",
        "target": "state"
      })

    if not meta['genre']:
      ret["errors"].append({
        "code": "ErrEmptyAdventureGenre",
        "target": "genre"
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    updateRet = adventures.update_one({'_id': ObjectId(adventureId)},
    {
      '$set': {
        'meta': meta
      }
    }, upsert=True)

    if not updateRet:
      ret["errors"].append({
        "code": "ErrUpdateFailed",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

  ret["status"] = "success"

  return jsonifySafe(ret)

@application.route("/<who>/adventures/<adventureId>/image", methods=["GET"])
def adventureImage(who, adventureId):
  adventures = db['adventure']
  adv = adventures.find_one({"_id": ObjectId(adventureId)})
  if not adv:
    abort(404)

  mapping = {
    "science_fiction": {
      "name": "Science Fiction",
      "icon": "fa-rocket",
      "color": "0d47a1",
      "code": 0xf135
    },
    "romance": {
      "name": "Romance",
      "icon": "fa-heart",
      "color": "880e4f",
      "code": 0xf004
    },
    "comedy": {
      "name": "Comedy",
      "icon": "fa-laugh",
      "color": "1565c0",
      "code": 0xf599
    },
    "horror": {
      "name": "Horror",
      "icon": "fa-skull",
      "color": "b71c1c",
      "code": 0xf54c
    },
    "western": {
      "name": "Western",
      "icon": "fa-hat-cowboy",
      "color": "9e9d24",
      "code": 0xf8c0
    },
    "adventure": {
      "name": "Adventure",
      "icon": "fa-mountain",
      "color": "1b5e20",
      "code": 0xf6fc
    },
    "fantasy": {
      "name": "Fantasy",
      "icon": "fa-magic",
      "color": "3f51b5",
      "code": 0xf0d0
    },
    "thriller": {
      "name": "Thriller",
      "icon": "fa-exclamation",
      "color": "004d40",
      "code": 0xf12a
    },
    "historical": {
      "name": "Historical",
      "icon": "fa-monument",
      "color": "263238",
      "code": 0xf5a6
    },
    "self_help": {
      "name": "Self Help",
      "icon": "fa-life-ring",
      "color": "e65100",
      "code": 0xf1cd
    }
  }
  genre = adv['meta']['genre']
  if not genre in mapping:
    abort(404)

  item = mapping[genre]
  color = item['color']
  filename = "./media/" + adventureId + ".png"
  if not path.exists(filename):
    rgb = tuple(int(color[i:i+2], 16) for i in (0, 2, 4))
    img = Image.new('RGB', (600, 315), color = 'white')
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype("./fontawesome/otfs/Font Awesome 5 Free-Solid-900.otf", 400)
    draw.text((100, -40), chr(item['code']), font=font, fill=rgb)
    if not os.path.exists('./media'):
      os.makedirs('./media')
    img.save(filename)
  return send_file(filename, mimetype='image/png')

@application.route("/<who>/adventures/<adventureId>", methods=["GET", "PUT", "DELETE"])
def adventureKnown(who, adventureId):
  ret = {}
  ret["status"] = "error"
  ret["errors"] = []

  userId = False

  if request.headers.get('Authorization'):
    userId = authorize(request.headers.get('Authorization'))

  if request.method == "PUT" or request.method == "DELETE":
    if not userId:
      ret["errors"].append({
        "code": "ErrNotAuthorized",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

  adventures = db['adventure']
  users = db['user']
  progress = db['progress']
  analytic = db['analytic']
  # progress.remove()

  if request.method == "GET":
    adv = adventures.find_one({"_id": ObjectId(adventureId)})
    if not adv:
      ret["errors"].append({
          "code": "ErrNotFound",
          "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    # find author info
    author = users.find_one({"_id": ObjectId(adv['userId'])})
    if not author:
      ret["errors"].append({
          "code": "ErrNotFound",
          "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    o = {
      "_id": str(author['_id']),
      "penName": author["penName"]
    }
    adv["user"] = o

    # find user progress
    clientId = getClientIdentifier()

    tmp = list(progress.find({
      "$and": [
        {"adventureId": adventureId},
        {
          "$or": [
            {"userId": userId},
            {
              "$and": [
                {"clientId": clientId},
                {"userId": None}
              ]
            }
          ]
        }
      ]
    }))
    progressList = []
    for a in tmp:
      a['_id'] = str(ObjectId(a['_id']))
      progressList.append(a)

    ret["data"] = {
      "adventure": adv
    }

    # get last item if exists
    if len(progressList):
      currentProgress = progressList[-1]
      ret["data"]["progress"] = currentProgress
      ret["data"]["progressId"] = currentProgress['_id']
    else:
      ret["data"]["progress"] = None
      ret["data"]["progressId"] = None

    adv['_id'] = str(ObjectId(adv['_id']))
    ret["status"] = "success"

    if request.args.get("mode"):
      metaTags = {
        "url": THIS_DOMAIN + "/all/adventures/" + adv['_id'] + "?mode=share",
        "redirect": "https://adventurizer.net/a/" + adventureId,
        "title": adv["meta"]["title"],
        "description": adv["meta"]["description"],
        "author": author["penName"],
        "image": THIS_DOMAIN + "/all/adventures/" + adv['_id'] + "/image" 
      }
      return renderAndRedirect(metaTags)

  elif request.method == "DELETE":
    adv = adventures.find_one({"_id": ObjectId(adventureId)})
    if not adv:
      ret["errors"].append({
        "code": "ErrNotFound",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    if adv['userId'] != userId:
      ret["errors"].append({
        "code": "ErrNotAuthorized",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    delRet = adventures.delete_one({"_id": ObjectId(adventureId)})
    if not delRet:
      ret["errors"].append({
        "code": "ErrDeleteFailed",
        "target": False
      })
    
    # delete all progress
    delRet = progress.delete_many({"adventureId": adventureId})

    ret["status"] = "success"

  elif request.method == "PUT":
    adv = adventures.find_one({"_id": ObjectId(adventureId)})
    if not adv:
      ret["errors"].append({
        "code": "ErrNotFound",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    if adv['userId'] != userId:
      ret["errors"].append({
        "code": "ErrNotAuthorized",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    data = request.json.get("data")
    view = request.json.get("view")
    meta = request.json.get("meta")

    if not meta['title']:
      ret["errors"].append({
        "code": "ErrEmptyAdventureTitle",
        "target": "title"
      })
    
    if not meta['state']:
      ret["errors"].append({
        "code": "ErrEmptyAdventureState",
        "target": "state"
      })

    if not meta['genre']:
      ret["errors"].append({
        "code": "ErrEmptyAdventureGenre",
        "target": "genre"
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    advNew  = adv.copy()
    del advNew['_id']
    advNew['data'] = data
    advNew['view'] = view
    advNew['meta'] = meta

    updateRet = adventures.replace_one({"_id": ObjectId(adventureId)}, advNew, False)

    if not updateRet:
      ret["errors"].append({
        "code": "ErrUpdateFailed",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    # delete all progress
    if(data != adv['data']):
      delRet = progress.delete_many({"adventureId": adventureId})

    ret["status"] = "success"
    ret["data"] = {
      "adventure": advNew
    }

  return jsonifySafe(ret)

@application.route("/<who>/adventures", methods=["POST", "GET"])
def adventursListing(who):
  ret = {}
  ret["status"] = "error"
  ret["errors"] = []

  userId = None
  if request.headers.get('Authorization'):
    userId = authorize(request.headers.get('Authorization'))

  if who == "me" and not userId:
    ret["errors"].append({
      "code": "ErrNotAuthorized",
      "target": False
    })

  if ret["errors"]:
    return jsonifySafe(ret)

  adventures = db['adventure']
  users = db['user']
  progress = db['progress']

  if request.method == "POST":
    # creating new adventure
    # can only do this if logged in
    if who != "me":
      ret["errors"].append({
        "code": "ErrNotAuthorized",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    data = request.json.get("data")
    view = request.json.get("view")
    meta = request.json.get("meta")

    if not meta['title']:
      ret["errors"].append({
        "code": "ErrEmptyAdventureTitle",
        "target": "title"
      })
    
    if not meta['state']:
      ret["errors"].append({
        "code": "ErrEmptyAdventureState",
        "target": "state"
      })
    
    if not meta['genre']:
      ret["errors"].append({
        "code": "ErrEmptyAdventureGenre",
        "target": "genre"
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    adv = {
      "userId": str(ObjectId(userId)),
      "data": data,
      "view": view,
      "meta": meta,
      "analytic": {
        "taken": 0,
        "lastTakenDate": datetime.utcnow()
      },
      "insertDate": datetime.utcnow()
    }

    adventureId = adventures.insert_one(adv).inserted_id

    if not adventureId:
      ret["errors"].append({
        "code": "ErrInsertFailed",
        "target": False
      })

    if ret["errors"]:
      return jsonifySafe(ret)

    ret["data"] = {
      "adventureId": str(ObjectId(adventureId))
    }
    ret["status"] = "success"

  elif request.method == "GET":
    searchLimit = 10
    if request.args.get('limit'):
      searchLimit = request.args.get('limit')

    searchSort = "trending"
    if request.args.get('sort'):
      searchSort = request.args.get('sort')
    
    page = 1
    if request.args.get('page'):
      page = request.args.get('page')
    
    skip = (int(page) - 1) * int(searchLimit)

    if searchSort == "trending":
      searchSortField = "analytic.lastTakenDate"
    elif searchSort == "popular":
      searchSortField = "analytic.taken"
    else:
      searchSortField = "insertDate"

    if who == "me":
      tot = adventures.count_documents({"userId": userId})
      totPages = math.ceil(tot / int(searchLimit))
      tmp = list(adventures.find({"userId": userId}).sort([(searchSortField, pymongo.DESCENDING)]).skip(skip).limit(int(searchLimit)))
    elif who == "all":
      tot = adventures.count_documents({"meta.state": "public"})
      totPages = math.ceil(tot / int(searchLimit))
      tmp = list(adventures.find({"meta.state": "public"}).sort([(searchSortField, pymongo.DESCENDING)]).skip(skip).limit(int(searchLimit)))

    userIdMap = {}
    for a in tmp:
      userIdMap[a['userId']] = True
    
    tmp2 = userIdMap.keys()
    userIds = []
    for a in tmp2:
      userIds.append(ObjectId(a))
    
    userList = list(users.find({
      "_id": {
        "$in": userIds
      }
    }))

    userMap = {}
    for a in userList:
      o = {}
      o['_id'] = str(a['_id'])
      o['penName'] = a['penName']
      userMap[o['_id']] = o
    
    finalList = []
    for a in tmp:
      a['_id'] = str(a['_id'])
      del a['data']
      del a['view']
      if a['userId'] in userMap:
        a['user'] = userMap[a['userId']]
      finalList.append(a)

    ret["status"] = "success"
    ret["data"] = {
      "pages": totPages,
      "adventures": finalList
    }

  return jsonifySafe(ret)

@application.route("/<who>/progress", methods=["GET"])
def progressRoute(who):
  ret = {}
  ret["status"] = "error"
  ret["errors"] = []

  userId = None
  if request.headers.get('Authorization'):
    userId = authorize(request.headers.get('Authorization'))

  if who == "me" and not userId:
    ret["errors"].append({
      "code": "ErrNotAuthorized",
      "target": False
    })

  if ret["errors"]:
    return jsonifySafe(ret)

  users = db['user']
  adventures = db['adventure']
  progress = db['progress']

  limit = 12
  if request.args.get('limit'):
    limit = request.args.get('limit')

  page = 1
  if request.args.get('page'):
    page = request.args.get('page')
  
  skip = (int(page) - 1) * int(limit)

  tot = len(list(progress.distinct("adventureId", {"userId": userId})))
  totPages = math.ceil(tot / int(limit))

  sortField = "insertDate"

  # fetching list of all progress
  # tmp = list(progress.distinct("adventureId", {"userId": userId}).sort([(sortField, pymongo.DESCENDING)]).skip(skip).limit(int(limit)))
  # tmp = list(progress.distinct("adventureId", {"userId": userId}).skip(skip).limit(int(limit)))

  pipeline = [
    {"$match": { "userId": userId }},
    {"$group": {"_id": "$adventureId", "doc":{"$first":"$$ROOT"}}},
    {"$replaceRoot":{"newRoot":"$doc"}},
    {"$sort": {"insertDate": 1}},
    {"$skip": skip},
    {"$limit": int(limit)}
  ]

  tmp = list(progress.aggregate(pipeline))
  
  progressList = []
  progressMap = {}
  whereIn = []
  for a in tmp:
    a['_id'] = str(ObjectId(a['_id']))
    if not a['adventureId'] in progressMap:
      progressMap[a['adventureId']] = []
    progressMap[a['adventureId']].append(a)

  tmp = progressMap.keys()
  adventureIds = []
  for a in tmp:
    adventureIds.append(ObjectId(a))

  tmp = list(adventures.find({
    "_id": {
      "$in": adventureIds
    }
  }))

  userIdMap = {}
  for a in tmp:
    userIdMap[a['userId']] = True
  
  tmp2 = userIdMap.keys()
  userIds = []
  for a in tmp2:
    userIds.append(ObjectId(a))
  
  userList = list(users.find({
    "_id": {
      "$in": userIds
    }
  }))

  userMap = {}
  for a in userList:
    o = {}
    o['_id'] = str(a['_id'])
    o['penName'] = a['penName']
    userMap[o['_id']] = o

  finalList = []
  for a in tmp:
    a['_id'] = str(a['_id'])
    del a['data']
    del a['view']
    if a['userId'] in userMap:
      a['user'] = userMap[a['userId']]
    if str(a['_id']) in progressMap:
      a['progresses'] = progressMap[str(a['_id'])]
    finalList.append(a)
  
  #to-do: sort listing of adventures by the latest progress record contained within


  ret["status"] = "success"
  ret["data"] = {
    "adventures": finalList,
    "pages": totPages
  }

  return jsonifySafe(ret)

@application.errorhandler(404) 
def not_found(e):
  ret = {}
  ret["status"] = "error"
  ret["errors"] = []
  ret["errors"].append({
    "code": "Err404"
  })
  return jsonifySafe(ret)

@application.errorhandler(500) 
def not_found(e):
  ret = {}
  ret["status"] = "error"
  ret["errors"] = []
  ret["errors"].append({
    "code": "Err500"
  })
  return jsonifySafe(ret)

if __name__ == "__main__":
  application.run(host='0.0.0.0')
