import React from 'react';
import axios from 'axios';
import { AxiosProvider, Request, Get, Delete, Head, Post, Put, Patch, withAxios } from 'react-axios';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { FormGroup, FormControlLabel, Checkbox, Paper, Box, Grid, TextField, Button } from '@material-ui/core';
import { Facebook as FacebookIcon } from '@material-ui/icons';
import { Link, Redirect } from "react-router-dom";
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props'

import Util from './../../Util.js';
import config from 'react-global-configuration';

import LoadingOverlay from './../modules/LoadingOverlay.js';

class Settings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      penName: {
        value: "",
        error: null
      },
      email: {
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
      },
      subscribed: {
        value: true,
        error: null
      },
      status: {
        loading: true
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
  toggleSubscribed(event) {
    let v = false;
    if(event.target.checked == "1") {
      v = true;
    }
    this.setState({
      subscribed: {
        value: event.target.checked,
        error: null
      }
    });
  }
  save() {
    let params = {};
    params['penName'] = this.state.penName.value;
    params['email'] = this.state.email.value;
    params['subscribed'] = this.state.subscribed.value;
    let o = this;
    o.setState({
      status: {
        loading: true
      }
    });
    axios.put(`${config.get("apiHost")}/user`, params)
      .then(res => {
        Util.processRequestReturn(res, o, "SuccAccountUpdated");
        
        o.setState({
          status: {
            loading: false
          },
          password: {
            value: "",
            error: null
          },
          passwordConfirm: {
            value: "",
            error: null
          }
        });
      });
  }
  componentDidMount() {
    let adventureId = this.state.adventureId;
    let params = {};
    let o = this;
    axios.get(`${config.get("apiHost")}/user`, params)
      .then(res => {
        let ret = Util.processRequestReturnSilent(res);
        if(!ret) {
          return;
        }
        let data = res['data']['data'];
        o.setState({
          status: {
            loading: false
          },
          penName: {
            value: data['user']['penName']['value'],
            error: null
          },
          email: {
            value: data['user']['email']['value'],
            error: null
          },
          subscribed: {
            value: data['user']['subscribed']['value'],
            error: null
          }
        });
      });
  }
  render() {

    return (
      <div>
        <div className="mainTitle">
          <h1>Settings</h1>
        </div>
        <div className="content contentSmall contentWithTitle">
          <Paper>
            <Box p={5}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box>
                    <TextField id="fieldSettingsPenName" label="Pen Name" required type="text" fullWidth 
                      value={this.state.penName.value}
                      error={this.state.penName.error != null}
                      helperText={this.state.penName.error}
                      onChange={e => this.set("penName", e.target.value)} 
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box>
                    <TextField id="fieldSettingsEmail" label="Email" required type="email" fullWidth 
                      value={this.state.email.value}
                      error={this.state.email.error != null}
                      helperText={this.state.email.error}
                      onChange={e => this.set("email", e.target.value)} 
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <FormGroup row>
                    <FormControlLabel
                      control={
                        <Checkbox checked={this.state.subscribed.value} onChange={(event) => this.toggleSubscribed(event)} value="1" />
                      }
                      label="I want to receive emails from Adventurizer"
                    />
                  </FormGroup>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Button variant="contained" color="primary" onClick={() => this.save()}>
                      Save
                    </Button>
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

export default Settings;