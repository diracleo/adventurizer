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
  }

  hide() {
    this.props.dispatch(setQuietAlertDialog({
      "open": false
    }));
  }

  render() {
    return (
      <Snackbar open={this.props.open} autoHideDuration={6000} onClose={() => this.hide()}>
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