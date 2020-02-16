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

import LoadingOverlay from './../modules/LoadingOverlay.js';

class Confirm extends React.Component {
  constructor(props) {
    super(props);
    let confirmToken = null;

    if(typeof(this.props.confirmToken) != 'undefined' && this.props.confirmToken != null) {
      confirmToken = this.props.confirmToken;
    }
    this.state = {
      confirmToken: confirmToken,
      confirmed: false,
      status: {
        loading: true
      }
    }
  }

  componentDidMount() {
    let confirmToken = this.state.confirmToken;
    let params = {};
    let o = this;
    axios.post(`${config.get("apiHost")}/confirm/${confirmToken}`, params)
      .then(res => {
        let ret = Util.processRequestReturnSilent(res);
        if(!ret) {
          return;
        }
        o.setState({
          status: {
            loading: false
          },
          confirmed: true
        });
      });
  }

  render() {
    if(this.state.confirmed === true) {
      return (
        <div className="content contentSmall">
          <Paper>
            <Box p={5}>
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
        </div>
      )
    }
    return (
      <div className="content contentSmall">
        <Paper>
          <Box p={5}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box>
                  Confirming...
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </div>
    );
  }
}

export default Confirm;