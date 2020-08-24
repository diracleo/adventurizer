import React from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Paper, Box, Grid, TextField, Button } from '@material-ui/core';

import Util from './../../Util.js';
import config from 'react-global-configuration';

import Footer from './../modules/Footer.js';
import LoadingOverlay from './../modules/LoadingOverlay.js';

class PlatformDown extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="wrapped centered">
        <div className="content contentSmall">
          <Paper className="contentInner">
            <Box p={3}>
              <h1>Down for Maintenance</h1>
              <p>Adventurizer is currently down for maintenance. Please check back later.</p>
            </Box>
          </Paper>
        </div>
        <Footer />
      </div>
    );
  }
}

export default PlatformDown;