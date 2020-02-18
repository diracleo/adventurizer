import React from 'react';
import axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { AxiosProvider, Request, Get, Delete, Head, Post, Put, Patch, withAxios } from 'react-axios';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Paper, Box, Grid, TextField, Button } from '@material-ui/core';
import { Facebook as FacebookIcon } from '@material-ui/icons';
import { Link, Redirect } from "react-router-dom";
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props'

import Util from './../../Util.js';
import config from 'react-global-configuration';

import Footer from './../modules/Footer.js';
import LoadingOverlay from './../modules/LoadingOverlay.js';

class Action extends React.Component {
  constructor(props) {
    super(props);
    let actionToken = null;

    if(typeof(this.props.actionToken) != 'undefined' && this.props.actionToken != null) {
      actionToken = this.props.actionToken;
    }
    this.state = {
      error: false,
      actionToken: actionToken,
      action: null,
      status: {
        complete: false,
        loading: true
      }
    }
  }

  resetPassword() {
    let actionToken = this.state.actionToken;
    let params = {};
    params['password'] = this.state.password.value;
    params['passwordConfirm'] = this.state.passwordConfirm.value;
    let o = this;
    o.setState({
      status: {
        loading: true
      }
    });
    axios.post(`${config.get("apiHost")}/action/${actionToken}`, params)
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
            status: {
              loading: false,
              complete: true
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

  set(key, value) {
    this.setState({
      [key]: {
        value: value
      }
    });
  }

  componentDidMount() {
    let actionToken = this.state.actionToken;
    let params = {};
    let o = this;
    axios.get(`${config.get("apiHost")}/action/${actionToken}`, params)
      .then(res => {
        let ret = Util.processRequestReturnSilent(res);
        if(!ret) {
          let newState = cloneDeep(this.state);
          newState["status"]["loading"] = false;
          newState["error"] = true;
          o.setState(newState);
          return;
        }
        let action = res['data']['data']['action'];
        let newState = cloneDeep(this.state);
        newState["status"]["loading"] = false;
        newState["action"] = action;
        if(action == "resetPassword") {
          newState["password"] = {
            value: "",
            error: null
          }
          newState["passwordConfirm"] = {
            value: "",
            error: null
          }
        }
        o.setState(newState);
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
    if(this.state.error) {
      return (
        <div className="wrapped centered">
          <div className="mainTitle">
            <h1>Error</h1>
          </div>
          <div className="content contentSmall contentWithTitle">
            <Paper className="contentInner">
              <Box p={3}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box>
                      <p>An error occurred.</p>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </div>
          <Footer />
        </div>
      );
    } else if(this.state.action === "confirmEmail") {
      return (
        <div className="wrapped centered">
          <div className="mainTitle">
            <h1>Email Confirmed</h1>
          </div>
          <div className="content contentSmall contentWithTitle">
            <Paper className="contentInner">
              <Box p={3}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box>
                      <p>Your account has been confirmed. You may now sign in.</p>
                      <Link to={`/login`} className="link">
                        <Button variant="contained" color="primary">
                          Sign In
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
    } else if(this.state.action === "changeEmail") {
      return (
        <div className="wrapped centered">
          <div className="mainTitle">
            <h1>Email Confirmed</h1>
          </div>
          <div className="content contentSmall contentWithTitle">
            <Paper className="contentInner">
              <Box p={3}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box>
                      <p>Your new email address has been confirmed.</p>
                      <Link to={`/settings`} className="link">
                        <Button variant="contained" color="primary">
                          Go Back to Settings
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
    } else if(this.state.action === "resetPassword") {
      if(this.state.status.complete) {
        return (
          <div className="wrapped centered">
            <div className="mainTitle">
              <h1>Change Password</h1>
            </div>
            <div className="content contentSmall contentWithTitle">
              <Paper className="contentInner">
                <Box p={3}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Box>
                        <p>You have successfully changed your password. You may now sign in using this new password.</p>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box>
                        <Link to={`/login`} className="link">
                          <Button variant="contained" color="primary">
                            Sign In
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
      } else {
        return (
          <div className="wrapped centered">
            <div className="mainTitle">
              <h1>Change Password</h1>
            </div>
            <div className="content contentSmall contentWithTitle">
              <Paper className="contentInner">
                <Box p={3}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Box>
                        <TextField id="fieldResetPassword" label="Enter a New Password" required type="password" fullWidth
                          value={this.state.password.value}
                          error={this.state.password.error != null}
                          helperText={this.state.password.error}
                          onChange={e => this.set("password", e.target.value)} 
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box>
                        <TextField id="fieldResetPasswordConfirm" label="Confirm New Password" required type="password" fullWidth 
                          value={this.state.passwordConfirm.value}
                          error={this.state.passwordConfirm.error != null}
                          helperText={this.state.passwordConfirm.error}
                          onChange={e => this.set("passwordConfirm", e.target.value)} 
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box>
                        <Button variant="contained" color="primary" onClick={() => this.resetPassword()}>
                          Change Password
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
    return (
      <div>
        <LoadingOverlay loading={this.state.status.loading} />
      </div>
    );
  }
}

export default Action;