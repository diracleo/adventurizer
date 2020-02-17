import React from 'react';
import axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { AxiosProvider, Request, Get, Delete, Head, Post, Put, Patch, withAxios } from 'react-axios';
import isEqual from "react-fast-compare";
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Pagination, Alert } from '@material-ui/lab';
import PaginationItem from '@material-ui/lab/PaginationItem';
import { MuiThemeProvider, Snackbar, CircularProgress, Button, ButtonGroup, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Box, Drawer, IconButton, TextField, Input, InputAdornment, AppBar, Toolbar, Paper, Card, CardActions, CardContent, Grid, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Fab, FormControlLabel, Menu, MenuItem, Typography, CssBaseline } from '@material-ui/core';
import { Search as SearchIcon, Visibility, Edit, Delete as DeleteIcon, AddBox } from '@material-ui/icons';
import { Link } from "react-router-dom";

import Util from './../../Util.js';
import config from 'react-global-configuration';

import LoadingOverlay from './../modules/LoadingOverlay.js';

import { connect } from "react-redux";
import { setConfirmDialog, setViewType } from "./../../action";

class AccountStatus extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      type: this.props.type,
      email: this.props.email,
      status: {
        loading: false
      }
    }
  }
  resendConfirmLink() {
    let o = this;
    o.setState({
      status: {
        loading: true
      }
    });
    let params = {};
    params['email'] = this.state.email;
    axios.post(`${config.get("apiHost")}/resendConfirmLink`, params)
      .then(res => {
        let ret = Util.processRequestReturnSilent(res);
        if(!ret) {
          o.setState({
            status: {
              loading: false
            }
          });
        } else {
          o.setState({
            emailSent: true,
            status: {
              loading: false
            }
          });
        }
      }).catch(error => {
        Util.displayError("ErrServerResponse");
        o.setState({
          status: {
            loading: false
          }
        });
      });
  }
  render() {
    const { email, emailSent } = this.state;

    if(this.state.type == "unconfirmed") {
      if(emailSent === true) {
        return (
          <Box>
            <Alert severity="info">Another email was just sent to {this.state.email}</Alert>
            <h1>Your account is not yet confirmed</h1>
            <p>Please click the link in the email to confirm your account and complete creation.</p>
            <LoadingOverlay loading={this.state.status.loading} />
          </Box>
        )
      } else {
        return (
          <Box>
            <h1>Your account is not yet confirmed</h1>
            <p>Please click the link in the email to confirm your account and complete creation. If after 5 minutes, you still haven't received an email from us, click the button below to resend the link.</p>
            <br/>
            <Button variant="contained" color="primary" onClick={() => this.resendConfirmLink()}>
              Resend Link
            </Button>
            <LoadingOverlay loading={this.state.status.loading} />
          </Box>
        );
      }
    } else {
      return (
        <Box>
          <h1>There is a problem with your account</h1>
          <p>Please contact us for more information.</p>
          <LoadingOverlay loading={this.state.status.loading} />
        </Box>
      )
    }
  }
}

const mapStateToProps = state => {
  const props = cloneDeep(state);
  return props;
};
export default connect(mapStateToProps)(AccountStatus);