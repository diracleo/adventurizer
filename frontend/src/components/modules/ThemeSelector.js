import React from 'react';

import { Hidden, MenuItem, AppBar, Toolbar, Grid, Button, Dialog, DialogContent, DialogContentText, TextField, FormControl, InputLabel, Select } from '@material-ui/core';

import Util from './../../Util.js';
import config from 'react-global-configuration';

class ThemeSelector extends React.Component {
  constructor(props) {
    super(props);
    this.themes = [
      {
        "key": "default",
        "name": "Default"
      },
      {
        "key": "defaultDark",
        "name": "Dark"
      },
      {
        "key": "autumn",
        "name": "Autumn"
      },
      {
        "key": "love",
        "name": "Love"
      },
      {
        "key": "spring",
        "name": "Spring"
      },
      {
        "key": "poseidon",
        "name": "Poseidon"
      },
      {
        "key": "navigator",
        "name": "Navigator"
      },
      {
        "key": "swashbuckler",
        "name": "Swashbuckler"
      },
      {
        "key": "thicket",
        "name": "Thicket"
      },
      {
        "key": "mountain",
        "name": "Mountain"
      },
      {
        "key": "existence",
        "name": "Existence"
      },
      {
        "key": "sky",
        "name": "Sky"
      },
      {
        "key": "storm",
        "name": "Storm"
      },
      {
        "key": "sand",
        "name": "Sand"
      }
    ];
  }

  renderThemeMenu() {
    let it = [];
    for(let i in this.themes) {
      it.push(
        <MenuItem className={`theme ${this.themes[i].key}`} key={`themeMenuItem_${this.themes[i].key}`} value={this.themes[i].key}>
          <div className="preview">
            <span>{this.themes[i].name}</span>
          </div>
        </MenuItem>
      );
    }
    return it;
  }

  render() {
    return (
      <FormControl fullWidth>
        <InputLabel id="fieldAdventureThemeLabel">Theme</InputLabel>
        <Select
          className="themeSelector"
          labelId="fieldAdventureThemeLabel"
          id="fieldAdventureTheme"
          value={this.props.value}
          onChange={this.props.onChange}
        >
          {this.renderThemeMenu()}
        </Select>
      </FormControl>
    );
  }
}

export default ThemeSelector;