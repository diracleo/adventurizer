import React from 'react';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@material-ui/core';

import Util from './../../Util.js';
import config from 'react-global-configuration';

import { connect } from "react-redux";
import { setConfirmDialog } from "./../../action";

class ConfirmDialog extends React.Component {
  constructor(props) {
    super(props);
  }

  hide() {
    this.props.dispatch(setConfirmDialog({
      "open": false
    }));
  }

  render() {
    return (
      <div>
        <Dialog
          open={this.props.open}
          onClose={() => this.hide()}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{this.props.title}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {this.props.description}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
                this.hide();
                if(this.props.confirmCallback != null) {
                  this.props.confirmCallback();
                }
              }} color="primary" autoFocus>
              Confirm
            </Button>
            <Button onClick={() => this.hide()} color="default">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const props = Object.assign({}, state.utils.confirmDialog);
  return props;
};

export default connect(mapStateToProps)(ConfirmDialog);