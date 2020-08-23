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

class Adventure:
  def __init__(self, db):
    self.db = db

  def fetch(self, adventureId):
    self.adventureId = adventureId
    adventures = self.db['adventure']

    ret = {}
    ret["status"] = "error"
    ret["errors"] = []

    adv = adventures.find_one({"_id": ObjectId(adventureId)})
    if not adv:
      ret["errors"].append({
        "code": "ErrNotFound",
        "target": False
      })

    if ret["errors"]:
      return ret
    
    self.adv = adv

    ret["status"] = "success"
    return ret
  
  def delete(self, userId):
    adventures = self.db['adventure']
    progress = self.db['progress']
    adv = self.adv

    ret = {}
    ret["status"] = "error"
    ret["errors"] = []

    if adv['userId'] != userId:
      ret["errors"].append({
        "code": "ErrNotAuthorized",
        "target": False
      })

    if ret["errors"]:
      return ret

    delRet = adventures.delete_one({"_id": ObjectId(self.adventureId)})
    if not delRet:
      ret["errors"].append({
        "code": "ErrDeleteFailed",
        "target": False
      })
    
    # delete all progress
    delRet = progress.delete_many({"adventureId": self.adventureId})

    ret["status"] = "success"
    return ret

  def get(self, userId, clientId):
    adventures = self.db['adventure']
    users = self.db['user']
    progress = self.db['progress']
    adv = self.adv

    ret = {}
    ret["status"] = "error"
    ret["errors"] = []

    # find author info
    author = users.find_one({"_id": ObjectId(adv['userId'])})
    if not author:
      ret["errors"].append({
          "code": "ErrNotFound",
          "target": False
      })

    if ret["errors"]:
      return ret

    o = {
      "_id": str(author['_id']),
      "penName": author["penName"]
    }
    adv["user"] = o

    # find user progress

    tmp = list(progress.find({
      "$and": [
        {"adventureId": self.adventureId},
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
    adv['meta']['penName'] = author['penName']
    ret["status"] = "success"

    return ret

  def change(self, userId, data, view, meta):
    adventures = self.db['adventure']
    progress = self.db['progress']
    adv = self.adv

    ret = {}
    ret["status"] = "error"
    ret["errors"] = []

    if adv['userId'] != userId:
      ret["errors"].append({
        "code": "ErrNotAuthorized",
        "target": False
      })

    if ret["errors"]:
      return ret

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
      return ret

    advNew  = adv.copy()
    del advNew['_id']
    advNew['data'] = data
    advNew['view'] = view
    advNew['meta'] = meta

    updateRet = adventures.replace_one({"_id": ObjectId(self.adventureId)}, advNew, False)

    if not updateRet:
      ret["errors"].append({
        "code": "ErrUpdateFailed",
        "target": False
      })

    if ret["errors"]:
      return ret

    # delete all progress
    if(data != adv['data']):
      delRet = progress.delete_many({"adventureId": self.adventureId})

    ret["status"] = "success"
    ret["data"] = {
      "adventure": advNew
    }
    return ret
  
  def changeMeta(self, userId, meta):
    adventures = self.db['adventure']
    adv = self.adv

    ret = {}
    ret["status"] = "error"
    ret["errors"] = []

    if adv['userId'] != userId:
      ret["errors"].append({
        "code": "ErrNotAuthorized",
        "target": False
      })

    if ret["errors"]:
      return ret

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
      return ret

    updateRet = adventures.update_one({'_id': ObjectId(self.adventureId)},
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
      return ret

    ret["status"] = "success"
    return ret
  
  def fetchListByFilters(self, userId, who, searchLimit, searchSort, page):
    adventures = self.db['adventure']
    progress = self.db['progress']
    users = self.db['user']

    ret = {}
    ret["status"] = "error"
    ret["errors"] = []
    
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
    adventureIds = []
    for a in tmp:
      userIdMap[a['userId']] = True
      adventureIds.append(str(a['_id']))
    
    tmp2 = userIdMap.keys()
    userIds = []
    for a in tmp2:
      userIds.append(ObjectId(a))
    
    userList = list(users.find({
      "_id": {
        "$in": userIds
      }
    }))

    progressList = list(progress.find({
      "adventureId": {
        "$in": adventureIds
      }
    }))

    userMap = {}
    for a in userList:
      o = {}
      o['_id'] = str(a['_id'])
      o['penName'] = a['penName']
      userMap[o['_id']] = o
    
    progressMap = {}
    for a in progressList:
      if not a['adventureId'] in progressMap:
        progressMap[a['adventureId']] = []
      o = a.copy()
      o['_id'] = str(o['_id'])
      progressMap[a['adventureId']].append(o)

    finalList = []
    for a in tmp:
      a['_id'] = str(a['_id'])
      del a['data']
      del a['view']
      if a['userId'] in userMap:
        a['user'] = userMap[a['userId']]
      
      a['progressStats'] = {}
      progressUserMap = {}
      progressCount = 0
      progressUserCount = 0
      takenDateLatest = date.min
      takenDateEarliest = date.max

      if a['_id'] in progressMap:
        a['progress'] = progressMap[a['_id']]
        for b in a['progress']:
          indi = b['clientId']
          if "userId" in b:
            indi = b['userId']
          if not indi in progressUserMap:
            progressUserMap[indi] = []
            progressUserCount += 1
          progressUserMap[indi].append(b)
          progressCount += 1
          """
          tsp = b['insertDate']
          if tsp < takenDateEarliest:
            takenDateEarliest = tsp
          if tsp > takenDateLatest:
            takenDateLatest = tsp
          """
        del a['progress']
      
      a['progressStats']['takenCount'] = progressCount
      a['progressStats']['usersTakenCount'] = progressUserCount
      a['progressStats']['lastTaken'] = takenDateLatest
      a['progressStats']['firstTaken'] = takenDateEarliest

      finalList.append(a)

    ret["status"] = "success"
    ret["data"] = {
      "pages": totPages,
      "adventures": finalList
    }
    return ret

  def create(self, userId, data, view, meta):
    adventures = self.db['adventure']

    ret = {}
    ret["status"] = "error"
    ret["errors"] = []

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
      return ret

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
      return ret

    ret["data"] = {
      "adventureId": str(ObjectId(adventureId))
    }
    ret["status"] = "success"
    self.adventureId = adventureId
    return ret

  def createProgress(self, userId, clientId):
    adventures = self.db['adventure']
    progress = self.db['progress']

    ret = {}
    ret["status"] = "error"
    ret["errors"] = []
    
    adv = self.adv
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
      return ret

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
      "adventureId": self.adventureId,
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
      return ret

    prog['_id'] = str(prog['_id'])


    adventures.update_one({'_id': ObjectId(self.adventureId)},
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
    return ret