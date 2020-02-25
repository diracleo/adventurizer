import React from 'react';

import { Hidden, MenuItem, AppBar, Toolbar, Grid, Button, Dialog, DialogContent, DialogContentText, TextField, FormControl, InputLabel, Select, Icon } from '@material-ui/core';

import Util from './../../Util.js';
import config from 'react-global-configuration';

class GenreSelector extends React.Component {
  constructor(props) {
    super(props);
  }

  renderGenreMenu() {
    let it = [];
    for(let i in Util.genres) {
      let genre = Util.genres[i];
      it.push(
        <MenuItem key={`genreMenuItem_${i}`} value={i} className="genreSelectorItem">
          <Icon fontSize="inherit" className={`fa fa-fw ${genre.icon}`} />
          &nbsp;
          {genre.name}
        </MenuItem>
      );
    }
    return it;
  }

  render() {
    return (
      <FormControl fullWidth>
        <InputLabel id="fieldAdventureThemeLabel">Genre</InputLabel>
        <Select
          className="genreSelector"
          labelId="fieldAdventureGenreLabel"
          id="fieldAdventureGenre"
          value={this.props.value}
          onChange={this.props.onChange}
        >
          {this.renderGenreMenu()}
        </Select>
      </FormControl>
    );
  }
}

export default GenreSelector;