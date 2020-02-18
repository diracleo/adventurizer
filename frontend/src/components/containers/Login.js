import React from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Paper, Box, Grid, TextField, Button } from '@material-ui/core';
import { Facebook as FacebookIcon, PersonAdd, Lock, Person } from '@material-ui/icons';
import { Link, Redirect } from "react-router-dom";
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props'

import Util from './../../Util.js';
import config from 'react-global-configuration';

import store from './../../store'
import { connect } from "react-redux";
import { setConfirmDialog, setQuietAlertDialog } from "./../../action";

import Footer from './../modules/Footer.js';
import AccountStatus from './../modules/AccountStatus.js';
import LoadingOverlay from './../modules/LoadingOverlay.js';

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      redirectToReferrer: false,
      accountProblem: false,
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
    Util.Auth.authenticate(this, params, (res) => {
      if(res['data']['status'] == "success") {
        o.setState({
          redirectToReferrer: true,
          status: {
            loading: false
          }
        });
      } else {
        let accountProblem = false;
        if(typeof(res.data.errors) != 'undefined') {
          for(let i = 0; i < res.data.errors.length; i++) {
            if(res.data.errors[i]['code'] == "ErrAccountNotConfirmed") {
              accountProblem = "unconfirmed";
              break;
            }
          }
        }
        o.setState({
          accountProblem: accountProblem,
          status: {
            loading: false
          }
        });
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
    const { email, redirectToReferrer, accountProblem } = this.state

    if (redirectToReferrer === true) {
      return <Redirect to={from} />
    } else if(accountProblem !== false) {
      return (
        <div className="wrapped centered">
          <div className="mainTitle">
            <h1>Sign In</h1>
          </div>
          <div className="content contentSmall contentWithTitle">
            <Paper className="contentInner">
              <Box p={3}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <AccountStatus type={accountProblem} email={email.value} />
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

    return (
      <div className="wrapped centered decorated">
        <div className="mainTitle">
          <h1>Sign In</h1>
        </div>
        <div className="content contentSmall contentWithTitle">
          <Paper className="contentInner">
            <Box p={3}>
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
                      <Person fontSize="small" />
                      &nbsp;
                      Sign In
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box className="loginSignupPromo">
                    <Link to="/signup" className="link">
                      <Button color="primary" size="small">
                        <PersonAdd fontSize="small" />
                        &nbsp;
                        I don't have an account
                      </Button>
                    </Link>
                  </Box>
                  <Box className="loginForgotPassword">
                    <Link to="/forgotPassword" className="link">
                      <Button color="primary" size="small">
                        <Lock fontSize="small" />
                        &nbsp;
                        I forgot my password
                      </Button>
                    </Link>
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

export default Login;