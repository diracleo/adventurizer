import React from 'react';
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

import LoadingOverlay from './../modules/LoadingOverlay.js';

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      redirectToReferrer: false,
      status: {
        loading: false
      },
      email: {
        value: "",
        error: null
      },
      password: {
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
  login() {
    let o = this;
    o.setState({
      status: {
        loading: true
      }
    });
    let params = {};
    params['email'] = this.state.email.value;
    params['password'] = this.state.password.value;
    Util.Auth.authenticate(this, params, (succ) => {
      o.setState({
        status: {
          loading: false
        }
      });
      if(succ) {
        this.setState(() => ({
          redirectToReferrer: true
        }))
      }
    })
  }
  responseFacebook(response) {
    let params = {};
    if(typeof(response['id']) == 'undefined' || typeof(response['email']) == 'undefined' || typeof(response['accessToken']) == 'undefined' || typeof(response['signedRequest']) == 'undefined') {
      store.dispatch(setQuietAlertDialog({
        open: true,
        severity: "error",
        description: "You must allow Adventurizer to access your information in order to sign in using Facebook"
      }));
    } else {
      params['externalType'] = "facebook";
      params['externalId'] = response['id'];
      params['email'] = response['email'];
      params['accessToken'] = response['accessToken'];
      params['signedRequest'] = response['signedRequest'];
      Util.Auth.authenticate(this, params, () => {
        this.setState(() => ({
          redirectToReferrer: true
        }))
      });
    }
  }
  render() {
    const { from } = this.props.location.state || { from: { pathname: '/' } }
    const { redirectToReferrer } = this.state

    if (redirectToReferrer === true) {
      return <Redirect to={from} />
    }

    return (
      <div>
        <div className="mainTitle">
          <h1>Sign In</h1>
        </div>
        <div className="content contentSmall contentWithTitle">
          <Paper>
            <Box p={5}>
              <Grid container spacing={3}>
                {/*
                <Grid item xs={12}>
                  <div className="facebookBtnHolder">
                    <FacebookLogin
                      appId="187870645609943"
                      autoLoad={false}
                      fields="name,email,picture"
                      callback={(response) => this.responseFacebook(response)} 
                      render={renderProps => (
                        <Button variant="contained" color="primary" onClick={renderProps.onClick} className="facebookBtn">
                          <FacebookIcon />
                          &nbsp; 
                          Sign in with Facebook
                        </Button>
                      )} />
                  </div>
                  <div className="or">
                    <span>OR</span>
                  </div>
                </Grid>
                */}
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
                    <TextField id="fieldLoginPassword" label="Password" required type="password" fullWidth 
                      value={this.state.password.value}
                      error={this.state.password.error != null}
                      helperText={this.state.password.error}
                      onChange={e => this.set("password", e.target.value)} 
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Button variant="contained" color="primary" onClick={() => this.login()}>
                      Sign In
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box className="loginSignupPromo">
                    Don't have an account? <Link to="/signup" className="link highlight">Sign Up</Link>
                  </Box>
                  <Box className="loginForgotPassword">
                    <Link to="/forgotPassword" className="link highlight">I forgot my password</Link>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
          <LoadingOverlay loading={this.state.status.loading} />
        </div>
      </div>
    )
  }
}

export default Login;