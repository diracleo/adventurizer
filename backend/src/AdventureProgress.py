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

class AdventureProgress:
  def __init__(self, db):
    self.db = db

  def fetch(self, userId, progressId):
    self.userId = userId
    self.progressId = progressId
    progress = self.db['progress']
    ret = {}
    ret["status"] = "error"
    ret["errors"] = []
    prog = progress.find_one({"_id": ObjectId(progressId)})

    if not prog:
      ret["errors"].append({
        "code": "ErrNotFound",
        "target": False
      })

    if ret["errors"]:
      return ret
    
    self.prog = prog

    ret["status"] = "success"
    return ret

  def fetchListByFilters(self, userId, who, limit, page):
    users = self.db['user']
    adventures = self.db['adventure']
    progress = self.db['progress']

    ret = {}
    ret["status"] = "error"
    ret["errors"] = []

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
    return ret

  def change(self, progData):
    progress = self.db['progress']
    prog = self.prog
    ret = {}
    ret["status"] = "error"
    ret["errors"] = []

    validated = False
    if not prog['userId']:
      if prog['clientId'] == clientId:
        validated = True
    else:
      if prog['userId'] == self.userId:
        validated = True

    if not validated:
      ret["errors"].append({
        "code": "ErrNotAuthorized",
        "target": False
      })

    if ret["errors"]:
      return ret

    updateRet = progress.replace_one({"_id": ObjectId(self.progressId)}, progData, False)

    if not updateRet:
      ret["errors"].append({
        "code": "ErrUpdateFailed",
        "target": False
      })

    if ret["errors"]:
      return ret

    ret["data"] = {
      "progressId": self.progressId,
      "progress": progData
    }
    ret["status"] = "success"
    return ret