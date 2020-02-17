
import axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { AxiosProvider, Request, Get, Delete, Head, Post, Put, Patch, withAxios } from 'react-axios';
import isEqual from "react-fast-compare";
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {SortableContainer, SortableElement, sortableHandle} from 'react-sortable-hoc';
import { spacing } from '@material-ui/system';
import MuiAlert from '@material-ui/lab/Alert';
import { MuiThemeProvider, Snackbar, CircularProgress, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Box, Drawer, IconButton, ButtonGroup, TextField, Input, InputAdornment, AppBar, Toolbar, Paper, Card, CardActions, CardContent, Grid, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Fab, FormControlLabel, Menu, MenuItem, Typography, CssBaseline } from '@material-ui/core';
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import { createMuiTheme, withStyles } from '@material-ui/core/styles';
import { Visibility, Save, Lock, LockOpen, Add, Edit, Link as LinkIcon, Unlink, Delete as DeleteIcon, Undo, Redo, DragHandle, More, MoreVert, PlayForWork, Flight, MergeType, CallSplit, QuestionAnswerOutlined, QuestionAnswer, Done, AddBox, CheckCircle, Inbox, MenuSharp, Home, ArrowBack } from '@material-ui/icons';
import AladinWoff2 from './fonts/aladin/aladin-v8-latin-regular.woff2';
import RobotoWoff2 from './fonts/roboto/roboto-v20-latin-regular.woff2';
import BangersTtf from './fonts/fontdinerSwanky/fontdiner-swanky-v10-latin-regular.woff2';

import config from 'react-global-configuration';

import store from './store'
import { connect } from "react-redux";
import { setConfirmDialog, setQuietAlertDialog } from "./action";

CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius, fill, stroke) {
  var cornerRadius = { upperLeft: 0, upperRight: 0, lowerLeft: 0, lowerRight: 0 };
  if (typeof stroke == "undefined") {
    stroke = true;
  }
  if (typeof radius === "object") {
    for (var side in radius) {
      cornerRadius[side] = radius[side];
    }
  }

  this.beginPath();
  this.moveTo(x + cornerRadius.upperLeft, y);
  this.lineTo(x + width - cornerRadius.upperRight, y);
  this.quadraticCurveTo(x + width, y, x + width, y + cornerRadius.upperRight);
  this.lineTo(x + width, y + height - cornerRadius.lowerRight);
  this.quadraticCurveTo(x + width, y + height, x + width - cornerRadius.lowerRight, y + height);
  this.lineTo(x + cornerRadius.lowerLeft, y + height);
  this.quadraticCurveTo(x, y + height, x, y + height - cornerRadius.lowerLeft);
  this.lineTo(x, y + cornerRadius.upperLeft);
  this.quadraticCurveTo(x, y, x + cornerRadius.upperLeft, y);
  this.closePath();
  if (stroke) {
    this.stroke();
  }
  if (fill) {
    this.fill();
  }
} 

var ui = {};

const uuidv1 = require('uuid/v1');

function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  var expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + "; expires=" + expires + "; path=/";
}
function removeCookie(cname) {
  document.cookie = cname + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
}
function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function reverseObject(object) {
  var newObject = {};
  var keys = [];

  for (var key in object) {
      keys.push(key);
  }

  for (var i = keys.length - 1; i >= 0; i--) {
    var value = object[keys[i]];
    newObject[keys[i]]= value;
  }       

  return newObject;
}

String.prototype.trunc = 
  function(n){
    return this.substr(0,n-1)+(this.length>n?'...':'');
  };

const translation = {
  ErrAccountNotConfirmed: "Account has not been confirmed yet.",
  ErrDeleteFailed: "Unable to delete record.",
  ErrEmailFailed: "Unable to send email.",
  ErrEmailLockedIn: "Unable to change email because your account is tied to Facebook",
  ErrEmptyAdventureTheme: "Adventure theme cannot be empty",
  ErrEmptyAdventureTitle: "Adventure name cannot be empty",
  ErrEmptyEmail: "Email cannot be blank.",
  ErrEmptyPassword: "Password cannot be blank.",
  ErrEmptyPenName: "Pen name cannot be blank.",
  ErrExistsEmail: "User with that email already exists",
  ErrExistsEmailDifferentMethod: "That account requires a different sign in method",
  ErrInsertFailed: "Unable to create new record",
  ErrInvalidCredentials: "Invalid email/password.",
  ErrInvalidEmail: "Invalid email (must be like someone@somedomain)",
  ErrInvalidPassword: "Password needs to be at least 6 characters",
  ErrMatchEmails: "Emails don't match",
  ErrMatchPasswords: "Passwords don't match",
  ErrNotAuthorized: "You are not authorized",
  ErrNotFound: "Not found",
  ErrServerResponse: "An error occurred. Please try again later.",
  ErrUnknown: "An unknown error occurred.",
  ErrUpdateFailed: "Unable to update record.",
  SuccEmailSent: "Email has been sent.",
  SuccLoggedIn: "Logged in",
  SuccLoggedOut: "Logged out",
  SuccAccountCreated: "Account created",
  SuccAccountUpdated: "Account updated",
  SuccAdventureSaved: "Adventure saved",
  SuccSubscriptionSaved: "Subscription saved"
};

function loadFacebookAPI() {
  window.fbAsyncInit = function() {
    window.FB.init({
      appId: "187870645609943",
      cookie: true,
      xfbml: true,
      version: 'v2.5'
    });
  };

  (function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));
}

function displayError(err) {
  store.dispatch(setQuietAlertDialog({
    open: true,
    severity: "error",
    description: translation[err]
  }));
}

function processRequestReturnSilent(res) {
  if(res.status != 200) {
    store.dispatch(setQuietAlertDialog({
      open: true,
      severity: "error",
      description: translation['ErrServerResponse']
    }));
    return false;
  }
  if(res.data.status != "success") {
    if(res.data.errors.length == 0) {
      store.dispatch(setQuietAlertDialog({
        open: true,
        severity: "error",
        description: translation['ErrUnknown']
      }));
      return false;
    }
    for(let i = 0; i < res.data.errors.length; i++) {
      store.dispatch(setQuietAlertDialog({
        open: true,
        severity: "error",
        description: translation[res.data.errors[i]['code']]
      }));
      if(res.data.errors[i]['code'] == "ErrNotAuthorized") {
        //unset cookie and then refresh - token is invalid
        removeCookie("accessToken");
        window.location.reload(true);
        return false;
      }
    }
    return false;
  }
  return true;
}
function processRequestReturn(res, o, successCode) {
  if(res.status != 200) {
    store.dispatch(setQuietAlertDialog({
      open: true,
      severity: "error",
      description: translation['ErrServerResponse']
    }));
    return false;
  }
  if(res.data.status != "success") {
    if(res.data.errors.length == 0) {
      store.dispatch(setQuietAlertDialog({
        open: true,
        severity: "error",
        description: translation['ErrUnknown']
      }));
      return false;
    }
    for(let i = 0; i < res.data.errors.length; i++) {
      if(typeof(o.state[res.data.errors[i]['target']]) != 'undefined') {
        var it = Object.assign({}, o.state[res.data.errors[i]['target']]);
        it['error'] = translation[res.data.errors[i]['code']];
        o.setState({
          [res.data.errors[i]['target']]: it
        });
      } else {
        store.dispatch(setQuietAlertDialog({
          open: true,
          severity: "error",
          description: translation[res.data.errors[i]['code']]
        }));
      }
      if(res.data.errors[i]['code'] == "ErrNotAuthorized") {
        //unset cookie and then refresh - token is invalid
        removeCookie("accessToken");
        window.location.reload(true);
        return false;
      }
    }
    return false;
  }
  store.dispatch(setQuietAlertDialog({
    open: true,
    severity: "success",
    description: translation[successCode]
  }));
  return true;
}
const Auth = {
  isAuthenticated: false,
  accessToken: false,
  check() {
    let accessToken = getCookie("accessToken");
    if(accessToken != null && accessToken != "") {
      this.isAuthenticated = true;
      this.accessToken = accessToken;
    }
  },
  authenticate(o, params, cb) {
    let authRef = this;
    axios.post(`${config.get("apiHost")}/login`, params)
      .then(res => {
        if(processRequestReturn(res, o, "SuccLoggedIn")) {
          authRef.isAuthenticated = true;
          authRef.accessToken = res['data']['data']['accessToken'];
          setCookie("accessToken", res['data']['data']['accessToken'], 30);
          cb(res);
        } else {
          cb(res);
        }
      }).catch(error => {
        displayError("ErrServerResponse");
        cb({});
      });
  },
  signout(o, params, cb) {
    let authRef = this;
    axios.post(`${config.get("apiHost")}/logout`)
      .then(res => {
        if(processRequestReturn(res, o, "SuccLoggedOut")) {
          authRef.isAuthenticated = false;
          removeCookie("accessToken");
          authRef.accessToken = "";
          cb();
        }
      });
  }
}

const roboto = {
  fontFamily: 'Roboto',
  fontStyle: 'normal',
  fontWeight: 400,
  src: `
    local('Roboto'),
    local('Roboto-Regular'),
    url(${RobotoWoff2}) format('woff2')
  `
};

const aladin = {
  fontFamily: 'Aladin',
  fontStyle: 'normal',
  fontWeight: 400,
  src: `
    local('Aladin Regular'),
    local('Aladin-Regular'),
    url(${AladinWoff2}) format('woff2')
  `
};

const fontdinerSwanky = {
  fontFamily: 'Fontdiner Swanky',
  fontStyle: 'normal',
  fontWeight: 400,
  src: `
    local('Fontdiner Swanky'),
    local('Fontdiner-Swanky'),
    url(${BangersTtf}) format('woff2')
  `
};

const theme = createMuiTheme({
  typography: {
    h1: {
      fontFamily: 'Fontdiner Swanky'
    }
  },
  palette: {
    primary: {
      main: '#673ab7',
    },
    secondary: {
      main: '#673ab7',
    }
  },
  overrides: {
    MuiCssBaseline: {
      '@global': {
        '@font-face': [roboto, fontdinerSwanky],
      },
    },
  },
});

function generateListBreakpoints(l, override) {
  let breakpoints = this.theme.theme.breakpoints.values;
  let w = window.innerWidth;
  let currentBreakpoint = "xs";
  for(let i in breakpoints) {
    if(w > breakpoints[i]) {
      currentBreakpoint = i;
    }
  }

  let layoutMap = [];
  let defaultLayout = {
    xs: 12,
    sm: 12,
    md: 6,
    lg: 4,
    xl: 3
  };
  if(l == 1) {
    defaultLayout = {
      xs: 12,
      sm: 12,
      md: 9,
      lg: 6,
      xl: 6
    };
  } else if(l == 2) {
    defaultLayout = {
      xs: 12,
      sm: 12,
      md: 6,
      lg: 6,
      xl: 6
    };
  } else if(l == 3) {
    defaultLayout = {
      xs: 12,
      sm: 12,
      md: 6,
      lg: 4,
      xl: 4
    };
    //first item
    let mp = {
      xs: 12,
      sm: 12,
      md: 12,
      lg: 4,
      xl: 4
    }
    layoutMap.push(mp);
  } else if(l == 4) {
    defaultLayout = {
      xs: 12,
      sm: 12,
      md: 6,
      lg: 6,
      xl: 3
    };
  } else if(l == 5) {
    defaultLayout = {
      xs: 12,
      sm: 12,
      md: 4,
      lg: 4,
      xl: 2
    };
    //first item
    let mp = {
      xs: 12,
      sm: 12,
      md: 6,
      lg: 6,
      xl: 4
    }
    layoutMap.push(mp);
    //second item
    mp = {
      xs: 12,
      sm: 12,
      md: 6,
      lg: 6,
      xl: 2
    }
    layoutMap.push(mp);
  } else if(l == 6) {
    defaultLayout = {
      xs: 12,
      sm: 12,
      md: 4,
      lg: 3,
      xl: 2
    };
    //first item
    let mp = {
      xs: 12,
      sm: 12,
      md: 4,
      lg: 6,
      xl: 2
    }
    layoutMap.push(mp);
    //second item
    mp = {
      xs: 12,
      sm: 12,
      md: 4,
      lg: 6,
      xl: 2
    }
    layoutMap.push(mp);
  } else if(l == 7) {
    defaultLayout = {
      xs: 12,
      sm: 12,
      md: 4,
      lg: 3,
      xl: 3
    };
    //first item
    let mp = {
      xs: 12,
      sm: 12,
      md: 6,
      lg: 4,
      xl: 4
    }
    layoutMap.push(mp);
    //second item
    mp = {
      xs: 12,
      sm: 12,
      md: 6,
      lg: 4,
      xl: 4
    }
    layoutMap.push(mp);
    //third item
    mp = {
      xs: 12,
      sm: 12,
      md: 6,
      lg: 4,
      xl: 4
    }
    layoutMap.push(mp);
    //fourth item
    mp = {
      xs: 12,
      sm: 12,
      md: 6,
      lg: 3,
      xl: 3
    }
    layoutMap.push(mp);
  } else if(l == 8) {
    defaultLayout = {
      xs: 12,
      sm: 12,
      md: 4,
      lg: 3,
      xl: 3
    };
    //first item
    let mp = {
      xs: 12,
      sm: 12,
      md: 6,
      lg: 3,
      xl: 3
    }
    layoutMap.push(mp);
    //second item
    mp = {
      xs: 12,
      sm: 12,
      md: 6,
      lg: 3,
      xl: 3
    }
    layoutMap.push(mp);
  }
  if(!override) {
    layoutMap = [];
  }
  return {
    default: defaultLayout,
    mapping: layoutMap
  }
}

axios.interceptors.request.use(function (config) {
  let accessToken = Auth.accessToken;
  if(accessToken != "") {
    config.headers.Authorization =  accessToken;
  } else {
    
  }
  return config;
});

export default {
  uuidv1,
  Auth,
  setCookie,
  removeCookie,
  reverseObject,
  translation,
  processRequestReturnSilent,
  processRequestReturn,
  displayError,
  ui,
  generateListBreakpoints,
  loadFacebookAPI,
  theme: {
    theme,
    fonts: {
      aladin: aladin,
      roboto: roboto
    }
  }
}