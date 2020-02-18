import React from 'react';
import axios from 'axios';
import { AxiosProvider, Request, Get, Delete, Head, Post, Put, Patch, withAxios } from 'react-axios';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { FormGroup, FormControlLabel, Checkbox, Paper, Box, Grid, TextField, Button } from '@material-ui/core';
import { CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon, CheckBox as CheckBoxIcon, Facebook as FacebookIcon, PersonAdd, Person } from '@material-ui/icons';
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

class Signup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      redirectToReferrer: false,
      status: {
        loading: false
      },
      emailSent: false,
      tos: {
        value: false,
        error: null
      },
      penName: {
        value: "",
        error: null
      },
      email: {
        value: "",
        error: null
      },
      emailConfirm: {
        value: "",
        error: null
      },
      password: {
        value: "",
        error: null
      },
      passwordConfirm: {
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
  responseFacebook(response) {
    if(typeof(response['id']) == 'undefined' || typeof(response['email']) == 'undefined' || typeof(response['accessToken']) == 'undefined' || typeof(response['signedRequest']) == 'undefined') {
      store.dispatch(setQuietAlertDialog({
        open: true,
        severity: "error",
        description: "You must allow Adventurizer to access your information in order to sign in using Facebook"
      }));
    } else {
      if(!this.state.tos.value) {
        store.dispatch(setQuietAlertDialog({
          open: true,
          severity: "error",
          description: "You must agree to the terms of use and privacy policy before signing up"
        }));
      } else {
        let params = {};
        params['externalType'] = "facebook";
        params['externalId'] = response['id'];
        params['email'] = response['email'];
        params['accessToken'] = response['accessToken'];
        params['signedRequest'] = response['signedRequest'];
        Util.Auth.authenticate(this, params, () => {
          this.setState(() => ({
            redirectToReferrer: true
          }))
        })
      }
    }
  }
  signup() {
    let o = this;
    if(!this.state.tos.value) {
      store.dispatch(setQuietAlertDialog({
        open: true,
        severity: "error",
        description: "You must agree to the terms of use and privacy policy before signing up"
      }));
    } else {
      o.setState({
        status: {
          loading: true
        }
      });
      let params = {};
      params['penName'] = this.state.penName.value;
      params['email'] = this.state.email.value;
      params['emailConfirm'] = this.state.emailConfirm.value;
      params['password'] = this.state.password.value;
      params['passwordConfirm'] = this.state.passwordConfirm.value;

      axios.post(`${config.get("apiHost")}/user`, params)
        .then(res => {
          Util.processRequestReturn(res, o, "SuccAccountCreated");
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
  }
  toggleTos(event) {
    let v = false;
    if(event.target.checked == "1") {
      v = true;
    }
    this.setState({
      tos: {
        value: event.target.checked,
        error: null
      }
    });
  }
  render() {
    const { from } = this.props.location.state || { from: { pathname: '/' } }
    const { redirectToReferrer, emailSent, penName, email } = this.state

    if (redirectToReferrer === true) {
      return <Redirect to={from} />
    } else if(emailSent === true) {
      return (
        <div className="wrapped centered decorated">
          <div className="content contentSmall">
            <Paper className="contentInner">
              <Box p={3}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <AccountStatus type="unconfirmed" email={email.value} />
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
          <h1>Sign Up</h1>
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
                    <TextField id="fieldSignupPenName" label="Pen Name" required type="text" fullWidth
                      value={this.state.penName.value}
                      error={this.state.penName.error != null}
                      helperText={this.state.penName.error}
                      onChange={e => this.set("penName", e.target.value)} 
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box>
                    <TextField id="fieldSignupEmail" label="Email" required type="email" fullWidth 
                      value={this.state.email.value}
                      error={this.state.email.error != null}
                      helperText={this.state.email.error}
                      onChange={e => this.set("email", e.target.value)} 
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box>
                    <TextField id="fieldSignupEmailConfirm" label="Confirm Email" required type="email" fullWidth
                      value={this.state.emailConfirm.value}
                      error={this.state.emailConfirm.error != null}
                      helperText={this.state.emailConfirm.error}
                      onChange={e => this.set("emailConfirm", e.target.value)}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box>
                    <TextField id="fieldSignupPassword" label="Password" required type="password" fullWidth 
                      value={this.state.password.value}
                      error={this.state.password.error != null}
                      helperText={this.state.password.error}
                      onChange={e => this.set("password", e.target.value)} 
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box>
                    <TextField id="fieldSignupPasswordConfirm" label="Confirm Password" required type="password" fullWidth 
                      value={this.state.passwordConfirm.value}
                      error={this.state.passwordConfirm.error != null}
                      helperText={this.state.passwordConfirm.error}
                      onChange={e => this.set("passwordConfirm", e.target.value)} 
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <FormGroup row>
                    <FormControlLabel
                      control={
                        <Checkbox checked={this.state.tos.value} onChange={(event) => this.toggleTos(event)} value="1" />
                      }
                      label={
                        <div>
                          <span>I accept the </span>
                          <Link target={"_blank"} to={'/terms'}>terms of use</Link>
                          <span> and </span>
                          <Link target={"_blank"} to={'/privacy'}>privacy policy</Link>
                        </div>
                      }
                    />
                  </FormGroup>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Button variant="contained" color="primary" onClick={() => this.signup()}>
                      <PersonAdd fontSize="small" />
                      &nbsp;
                      Sign Up
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box className="signupLoginPromo">
                    <Link to="/login" className="link">
                      <Button color="primary" size="small">
                        <Person fontSize="small" />
                        &nbsp;
                        I already have an account
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

export default Signup;