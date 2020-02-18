import React from 'react';
import axios from 'axios';
import { AxiosProvider, Request, Get, Delete, Head, Post, Put, Patch, withAxios } from 'react-axios';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Paper, Box, Grid, TextField, Button } from '@material-ui/core';
import { Facebook as FacebookIcon } from '@material-ui/icons';
import { Link, Redirect } from "react-router-dom";
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props'

import Util from './../../Util.js';
import config from 'react-global-configuration';

import store from './../../store'
import { connect } from "react-redux";
import { setConfirmDialog, setQuietAlertDialog } from "./../../action";

import Footer from './../modules/Footer.js';
import LoadingOverlay from './../modules/LoadingOverlay.js';

class ForgotPassword extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      status: {
        loading: false
      },
      email: {
        value: "",
        error: null
      }
    }
  }
  set(key, value) {
    this.setState({
      [key]: {
        value: value
      }
    });
  }
  forgotPassword() {
    let o = this;
    o.setState({
      status: {
        loading: true
      }
    });
    let params = {};
    params['email'] = this.state.email.value;

    axios.post(`${config.get("apiHost")}/forgotPassword`, params)
      .then(res => {
        Util.processRequestReturn(res, o, "SuccEmailSent");
        if(res['data']['status'] == "success") {
          o.setState(() => ({
            emailSent: true,
            status: {
              loading: false
            }
          }))
        } else {
          o.setState(() => ({
            status: {
              loading: false
            }
          }))
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
    const { emailSent } = this.state

    if(emailSent === true) {
      return (
        <div className="wrapped centered">
          <div className="content contentSmall">
            <Paper className="contentInner">
              <Box p={3}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box>
                      A link to reset your password has been sent to your email
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </div>
          <Footer />
        </div>
      )
    }

    return (
      <div className="wrapped centered">
        <div className="mainTitle">
          <h1>Forgot Password</h1>
        </div>
        <div className="content contentSmall contentWithTitle">
          <Paper className="contentInner">
            <Box p={3}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box>
                    <TextField id="fieldLoginEmail" label="Email" required type="email" fullWidth autoFocus
                      value={this.state.email.value}
                      error={this.state.email.error != null}
                      helperText={this.state.email.error}
                      onChange={e => this.set("email", e.target.value)} 
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box>
                    <Button variant="contained" color="primary" onClick={() => this.forgotPassword()}>
                      Send Reset Password Link
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
          <LoadingOverlay loading={this.state.status.loading} />
        </div>
        <Footer />
      </div>
    )
  }
}

export default ForgotPassword;