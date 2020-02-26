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
    if(typeof(this.props.circleStyle) != 'undefined') {
      this.circleStyle = this.props.circleStyle;
    }
    return (
      <div className={loaderClass}>
        <CircularProgress disableShrink style={this.circleStyle} />
      </div>
    );
  }
}

export default LoadingOverlay;