import React from 'react';
import { CircularProgress } from '@material-ui/core';

import Util from './../../Util.js';
import config from 'react-global-configuration';

class LoadingOverlay extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let loaderClass = "loader";
    if(this.props.loading) {
      loaderClass += " loading";
    }
    return (
      <div className={loaderClass}>
        <CircularProgress color="secondary" disableShrink />
      </div>
    );
  }
}

export default LoadingOverlay;