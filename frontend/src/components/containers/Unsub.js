import React from 'react';
import axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { AxiosProvider, Request, Get, Delete, Head, Post, Put, Patch, withAxios } from 'react-axios';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Paper, Box, Grid, TextField, Button, FormGroup, FormControlLabel, Checkbox } from '@material-ui/core';
import { Facebook as FacebookIcon } from '@material-ui/icons';
import { Link, Redirect } from "react-router-dom";
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props'

import Util from './../../Util.js';
import config from 'react-global-configuration';

import LoadingOverlay from './../modules/LoadingOverlay.js';

class Unsub extends React.Component {
  constructor(props) {
    super(props);
    let unsubToken = null;

    if(typeof(this.props.unsubToken) != 'undefined' && this.props.unsubToken != null) {
      unsubToken = this.props.unsubToken;
    }
    this.state = {
      error: false,
      unsubToken: unsubToken,
      email: null,
      subscribed: true,
      status: {
        loading: true
      }
    }
  }

  saveSubscribed(event) {
    let v = false;
    if(event.target.checked == "1") {
      v = true;
    }
    let unsubToken = this.state.unsubToken;
    let params = {};
    params['subscribed'] = v;
    let o = this;
    o.setState({
      status: {
        loading: true
      }
    });
    axios.post(`${config.get("apiHost")}/unsub/${unsubToken}`, params)
      .then(res => {
        let ret = Util.processRequestReturn(res, o, "SuccSubscriptionSaved");
        if(!ret) {
          o.setState({
            status: {
              loading: false
            }
          });
        } else {
          o.setState({
            subscribed: params['subscribed'],
            status: {
              loading: false
            }
          });
        }
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
    let unsubToken = this.state.unsubToken;
    let params = {};
    let o = this;
    axios.get(`${config.get("apiHost")}/unsub/${unsubToken}`, params)
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
            email: res.data.data['email'],
            subscribed: res.data.data['subscribed'],
            status: {
              loading: false
            }
          });
        }
      });
  }

  render() {
    if(typeof(this.state.email) != null) {
      return (
        <div>
          <div className="mainTitle">
            <h1>Receive Emails</h1>
          </div>
          <div className="content contentSmall contentWithTitle">
            <Paper>
              <Box p={3}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <h2>{this.state.email}</h2>
                  </Grid>
                  <Grid item xs={12}>
                    <FormGroup row>
                      <FormControlLabel
                        control={
                          <Checkbox checked={this.state.subscribed} onChange={(event) => this.saveSubscribed(event)} value="1" />
                        }
                        label="Receive emails from Adventurizer"
                      />
                    </FormGroup>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </div>
        </div>
      );
    } else {
      return (
        <LoadingOverlay loading={this.state.status.loading} />
      )
    }
  }
}

export default Unsub;