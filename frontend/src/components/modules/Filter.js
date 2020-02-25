import React from 'react';

import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import { Hidden, Menu, MenuItem, AppBar, Toolbar, Grid, Button, Dialog, DialogContent, DialogContentText, TextField, FormControl, InputLabel, Select, Icon } from '@material-ui/core';
import { Share, Visibility, Edit, Delete as DeleteIcon, AddBox, FilterList } from '@material-ui/icons';

import Util from './../../Util.js';
import config from 'react-global-configuration';

class Filter extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <PopupState variant="popover" popupId="filter-popup-menu">
        {popupState => (
          <React.Fragment>
            <Button color="primary" {...bindTrigger(popupState)}>
              <FilterList /> &nbsp; Filter
            </Button>
            <Menu {...bindMenu(popupState)} color="primary">
              <MenuItem>
                Coming Soon
              </MenuItem>
            </Menu>
          </React.Fragment>
        )}
      </PopupState>
    );
  }
}

export default Filter;