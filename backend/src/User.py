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
from src.Adventure import Adventure

class User:
  def __init__(self, db):
    self.db = db

  def fetch(self, userId):
    self.userId = userId
    users = self.db['user']
    user = users.find_one({"_id": ObjectId(self.userId)})
    ret = {}
    ret["status"] = "error"
    ret["errors"] = []
    if not user:
      ret["errors"].append({
        "code": "ErrNotFound",
        "target": False
      })
    
    if ret["errors"]:
      return ret
    
    self.user = user

    ret["status"] = "success"
    return ret
  
  def get(self):
    return self.user

  def getAdventures(self, userId):
    adventures = self.db['adventure']
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
    return ret

  def create(self, penName, email, emailConfirm, password, passwordConfirm, testing):
    users = self.db['user']

    ret = {}
    ret["status"] = "error"
    ret["errors"] = []
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
      return ret

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
      return ret

    exists = users.find_one({"email": email})
    if exists:
      ret["errors"].append({
        "code": "ErrExistsEmail",
        "target": "email"
      })

    if ret["errors"]:
      return ret

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
      return ret

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
      return ret

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
      return ret

    sendRet = sendConfirmAccountEmail(self.db, email, penName, actionToken)

    if not sendRet:
      ret["errors"].append({
        "code": "ErrEmailSending",
        "target": False
      })

    if ret["errors"]:
      return ret

    ret["status"] = "success"

    if testing:
      ret["data"] = {}
      ret["data"]["actionToken"] = actionToken

    return ret
  
  def change(self, penName, subscribed):
    users = self.db['user']
    nosends = self.db['nosend']
    user = self.user
    ret = {}
    ret["status"] = "error"
    ret["errors"] = []

    userNew = user.copy()
    del userNew['_id']
    userNew['penName'] = penName
    userNew['subscribed'] = subscribed

    updateRet = users.update_one({'_id': ObjectId(self.userId)},
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
    return ret

  def delete(self, password):
    users = self.db['user']
    progress = self.db['progress']
    adventures = self.db['adventure']
    user = self.user
    ret = {}
    ret["status"] = "error"
    ret["errors"] = []

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
    
    
    delRet = users.delete_one({"_id": ObjectId(self.userId)})
    if not delRet:
      ret["errors"].append({
        "code": "ErrDeleteFailed",
        "target": False
      })
    
    # delete all user progress
    delRet = progress.delete_many({"userId": self.userId})

    # delete all user adventures
    delRet = adventures.delete_many({"userId": self.userId})

    ret["status"] = "success"
    return ret

  def changePassword(self, password, passwordNew, passwordNewConfirm):
    users = self.db['user']
    user = self.user
    ret = {}
    ret["status"] = "error"
    ret["errors"] = []

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
      return ret
    
    if len(passwordNew) < 6:
      ret["errors"].append({
        "code": "ErrInvalidPassword",
        "target": "passwordNew"
      })

    if ret["errors"]:
      return ret

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
      return ret

    ret["status"] = "success"
    return ret

  def changeEmail(self, password, emailNew, emailNewConfirm):
    users = self.db['user']
    user = self.user
    ret = {}
    ret["status"] = "error"
    ret["errors"] = []

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
      return ret

    regPatt = '^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$'
    if not re.search(regPatt, emailNew):
      ret["errors"].append({
        "code": "ErrInvalidEmail",
        "target": "emailNew"
      })

    if ret["errors"]:
      return ret

    if emailNew == user['email']:
      ret["errors"].append({
        "code": "ErrSameEmail",
        "target": "emailNew"
      })

    if ret["errors"]:
      return ret
    
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
      return ret

    # check if email already taken
    exists = users.find_one({"email": emailNew})
    if exists:
      ret["errors"].append({
        "code": "ErrExistsEmail",
        "target": "emailNew"
      })

    if ret["errors"]:
      return ret

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
      return ret

    sendRet = sendChangeAccountEmail(self.db, emailNew, user['penName'], actionToken)

    if not sendRet:
      ret["errors"].append({
        "code": "ErrEmailFailed",
        "target": "email"
      })

    if ret["errors"]:
      return ret
    
    ret["status"] = "success"
    return ret