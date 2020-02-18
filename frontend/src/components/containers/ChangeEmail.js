import React from 'react';
import axios from 'axios';
import { AxiosProvider, Request, Get, Delete, Head, Post, Put, Patch, withAxios } from 'react-axios';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Alert } from '@material-ui/lab';
import { FormGroup, FormControlLabel, Checkbox, Paper, Box, Grid, TextField, Button, IconButton } from '@material-ui/core';
import { Edit, Facebook as FacebookIcon } from '@material-ui/icons';
import { Link, Redirect } from "react-router-dom";
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props'

import Util from './../../Util.js';
import config from 'react-global-configuration';

import Footer from './../modules/Footer.js';
import LoadingOverlay from './../modules/LoadingOverlay.js';

class ChangeEmail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      password: {
        value: "",
        error: null
      },
      emailNew: {
        value: "",
        error: null
      },
      emailNewConfirm: {
        value: "",
        error: null
      },
      status: {
        loading: false
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
  save() {
    let params = {};
    params['password'] = this.state.password.value;
    params['emailNew'] = this.state.emailNew.value;
    params['emailNewConfirm'] = this.state.emailNewConfirm.value;
    let o = this;
    o.setState({
      status: {
        loading: true
      }
    });
    axios.put(`${config.get("apiHost")}/user/email`, params)
      .then(res => {
        Util.processRequestReturn(res, o, "SuccAccountUpdated");
        
        if(res.data.status == "success") {
          o.setState({
            status: {
              loading: false
            },
            password: {
              value: "",
              error: null
            },
            emailNew: {
              value: "",
              error: null
            },
            emailNewConfirm: {
              value: "",
              error: null
            }
          });
        } else {
          o.setState({
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

    return (
      <div className="wrapped centered">
        <div className="mainTitle">
          <h1>Change Email</h1>
        </div>
        <div className="content contentSmall contentWithTitle">
          <Paper className="contentInner">
            <Box p={3}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box>
                    <TextField id="fieldSettingsPassword" label="Enter Current Password" required type="password" fullWidth
                      value={this.state.password.value}
                      error={this.state.password.error != null}
                      helperText={this.state.password.error}
                      onChange={e => this.set("password", e.target.value)} 
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box>
                    <TextField id="fieldSettingsEmailNew" label="Enter New Email" required type="email" fullWidth 
                      value={this.state.emailNew.value}
                      error={this.state.emailNew.error != null}
                      helperText={this.state.emailNew.error}
                      onChange={e => this.set("emailNew", e.target.value)} 
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box>
                    <TextField id="fieldSettingsEmailNewConfirm" label="Confirm New Email" required type="email" fullWidth 
                      value={this.state.emailNewConfirm.value}
                      error={this.state.emailNewConfirm.error != null}
                      helperText={this.state.emailNewConfirm.error}
                      onChange={e => this.set("emailNewConfirm", e.target.value)} 
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box mb={3}>
                    <Alert severity="info">Note that you will need to click the confirmation link that will be sent to this new email address before this change takes effect.</Alert>
                  </Box>
                  <Box>
                    <Button variant="contained" color="primary" onClick={() => this.save()}>
                      Change Email
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

export default ChangeEmail;