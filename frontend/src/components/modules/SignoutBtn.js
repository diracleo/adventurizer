import React from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { List, ListItem, ListItemText, ListItemIcon } from '@material-ui/core';
import { LockOpen } from '@material-ui/icons';
import { Link, withRouter, useHistory } from "react-router-dom";

import Util from './../../Util.js';
import config from 'react-global-configuration';

const SignoutBtn = withRouter(({ history }) => (
  <Link to="/logout" className="link" key="mainMenuSignoutLink" onClick={() => {
    Util.Auth.signout(this, {}, () => history.push('/'))
  }}>
    <ListItem button key="mainMenuSignoutBtn">
      <ListItemIcon><LockOpen /></ListItemIcon>
      <ListItemText primary="Sign Out" />
    </ListItem>
  </Link>
));

export default SignoutBtn;