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
from src.Account import Account
from src.User import User
from src.Adventure import Adventure
from src.AdventureProgress import AdventureProgress

application = Flask(__name__)

mongo = MongoClient(DB_PATH)
db = mongo["adventurizer"]

CORS(application, resources={r"/*": {"origins": ACCEPTED_ORIGINS}})

@application.before_request
def before_request_func():
  # Check if API is enabled
  if PLATFORM_STATUS != 'up':
    ret = {}
    ret["status"] = "error"
    ret["errors"] = []
    ret["errors"].append({
      "code": "ErrPlatformDown",
      "target": False
    })
    return ret

# Endpoint that AWS calls to report email sending analytics
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
  email = request.json.get("email")
  password = request.json.get("password")
  externalType = request.json.get("externalType")

  accountObj = Account(db)

  if externalType:
    # external login
    ret = accountObj.loginExternal(externalType)
  else:
    # internal login
    ret = accountObj.login(email, password)

  return jsonifySafe(ret)


@application.route("/logout", methods=["GET", "POST"])
def logout():
  accountObj = Account(db)
  ret = accountObj.logout()
  return jsonifySafe(ret)

@application.route("/resendConfirmLink", methods=["POST"])
def resendConfirmLink():
  email = request.json.get("email")
  accountObj = Account(db)
  ret = accountObj.resendConfirmLink(email)
  return jsonifySafe(ret)

@application.route("/forgotPassword", methods=["POST"])
def forgotPassword():
  email = request.json.get("email")
  accountObj = Account(db)
  ret = accountObj.forgotPassword(email)
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
  
  userObj = User(db)
  ret = userObj.fetch(userId)

  if ret["errors"]:
    return jsonifySafe(ret)

  password = request.json.get("password")
  passwordNew = request.json.get("passwordNew")
  passwordNewConfirm = request.json.get("passwordNewConfirm")
  
  ret = userObj.changePassword(password, passwordNew, passwordNewConfirm)

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
  
  userObj = User(db)
  ret = userObj.fetch(userId)

  if ret["errors"]:
    return jsonifySafe(ret)

  password = request.json.get("password")
  emailNew = request.json.get("emailNew")
  emailNewConfirm = request.json.get("emailNewConfirm")
  
  ret = userObj.changeEmail(password, emailNew, emailNewConfirm)

  return jsonifySafe(ret)

@application.route("/me", methods=["GET", "POST", "PUT", "DELETE"])
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
    
    userObj = User(db)
    ret = userObj.fetch(userId)

    if ret["errors"]:
      return jsonifySafe(ret)

    user = userObj.get()

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

    userObj = User(db)
    ret = userObj.fetch(userId)

    if ret["errors"]:
      return jsonifySafe(ret)

    penName = request.json.get("penName")
    subscribed = request.json.get("subscribed")

    ret = userObj.change(penName, subscribed)

  elif request.method == "POST":
    # signing up as new user
    penName = request.json.get("penName")
    email = request.json.get("email")
    emailConfirm = request.json.get("emailConfirm")
    password = request.json.get("password")
    passwordConfirm = request.json.get("passwordConfirm")
    testing = request.json.get("testing")

    userObj = User(db)
    ret = userObj.create(penName, email, emailConfirm, password, passwordConfirm, testing)

  elif request.method == "DELETE":
    # deleting logged-in user
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

    userObj = User(db)
    ret = userObj.fetch(userId)

    if ret["errors"]:
      return jsonifySafe(ret)

    password = request.json.get("password")

    ret = userObj.delete(password)

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

  if request.method == "PUT":
    # update adventure progress

    adventureProgressObj = AdventureProgress(db)
    ret = adventureProgressObj.fetch(userId, progressId)

    if ret["errors"]:
      return jsonifySafe(ret)
    
    progData = request.json.get("progress")
    del progData['_id']

    ret = adventureProgressObj.change(progData)

    return jsonifySafe(ret)

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

    adventureObj = Adventure(db)
    adventureObj.fetch(adventureId)
    ret = adventureObj.createProgress(userId, clientId)

  elif request.method == "GET":
    # fetching list of all adventures
    userObj = User(db)
    ret = userObj.getAdventures(userId)

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

  if request.method == "PUT":
    adventureObj = Adventure(db)
    ret = adventureObj.fetch(adventureId)

    if ret["errors"]:
      return jsonifySafe(ret)

    meta = request.json.get("meta")
    
    ret = adventureObj.changeMeta(userId, meta)

  return jsonifySafe(ret)

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

    clientId = getClientIdentifier()

    adventureObj = Adventure(db)
    ret = adventureObj.fetch(adventureId)
    if ret["errors"]:
      return jsonifySafe(ret)
    ret = adventureObj.get(userId, clientId)

    if request.args.get("mode"):
      metaTags = {
        "url": THIS_DOMAIN + "/all/adventures/" + ret["data"]["adventure"]['_id'] + "?mode=share",
        "redirect": "https://adventurizer.net/a/" + adventureId,
        "title": ret["data"]["adventure"]["meta"]["title"],
        "description": ret["data"]["adventure"]["meta"]["description"],
        "author": ret["data"]["adventure"]["penName"],
        "image": THIS_DOMAIN + "/all/adventures/" + ret["data"]["adventure"]['_id'] + "/image" 
      }
      return renderAndRedirect(metaTags)

  elif request.method == "DELETE":

    adventureObj = Adventure(db)
    ret = adventureObj.fetch(adventureId)
    if ret["errors"]:
      return jsonifySafe(ret)
    ret = adventureObj.delete(userId)

  elif request.method == "PUT":

    data = request.json.get("data")
    view = request.json.get("view")
    meta = request.json.get("meta")

    adventureObj = Adventure(db)
    ret = adventureObj.fetch(adventureId)
    if ret["errors"]:
      return jsonifySafe(ret)
    ret = adventureObj.change(userId, data, view, meta)

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

    adventureObj = Adventure(db)
    ret = adventureObj.create(userId, data, view, meta)

  elif request.method == "GET":

    adventureObj = Adventure(db)

    searchLimit = 10
    if request.args.get('limit'):
      searchLimit = request.args.get('limit')

    searchSort = "trending"
    if request.args.get('sort'):
      searchSort = request.args.get('sort')
    
    page = 1
    if request.args.get('page'):
      page = request.args.get('page')

    ret = adventureObj.fetchListByFilters(userId, who, searchLimit, searchSort, page)

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

  limit = 12
  if request.args.get('limit'):
    limit = request.args.get('limit')

  page = 1
  if request.args.get('page'):
    page = request.args.get('page')
  
  adventureProgressObj = AdventureProgress(db)
  ret = adventureProgressObj.fetchListByFilters(userId, who, limit, page)

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
