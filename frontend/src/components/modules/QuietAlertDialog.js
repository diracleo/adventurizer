import React from 'react';
import MuiAlert from '@material-ui/lab/Alert';
import { Snackbar } from '@material-ui/core';

import Util from './../../Util.js';
import config from 'react-global-configuration';

import { connect } from "react-redux";
import { setQuietAlertDialog } from "./../../action";

class QuietAlertDialog extends React.Component {
  constructor(props) {
    super(props);
    this.color = null;
    if(this.props.severity == "success") {
      this.autoHideDuration = 1000;
    } else {
      this.autoHideDuration = 15000;
    }
  }

  hide() {
    this.props.dispatch(setQuietAlertDialog({
      "open": false
    }));
  }

  render() {
    return (
      <Snackbar open={this.props.open} autoHideDuration={this.autoHideDuration} onClose={() => this.hide()}>
        <MuiAlert elevation={6} variant="filled" onClose={() => this.hide()} severity={this.props.severity}>
          {this.props.description}
        </MuiAlert>
      </Snackbar>
    );
  }
}

const mapStateToProps = state => {
  const props = Object.assign({}, state.utils.quietAlertDialog);
  return props;
};

export default connect(mapStateToProps)(QuietAlertDialog);