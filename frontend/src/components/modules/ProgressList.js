import React from 'react';
import axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { AxiosProvider, Request, Get, Delete, Head, Post, Put, Patch, withAxios } from 'react-axios';
import isEqual from "react-fast-compare";
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Pagination } from '@material-ui/lab';
import PaginationItem from '@material-ui/lab/PaginationItem';
import { Icon, MuiThemeProvider, Snackbar, CircularProgress, Button, ButtonGroup, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Box, Drawer, IconButton, TextField, Input, InputAdornment, AppBar, Toolbar, Paper, Card, CardActions, CardContent, Grid, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Fab, FormControlLabel, Menu, MenuItem, Typography, CssBaseline } from '@material-ui/core';
import { Search as SearchIcon, Visibility, Edit, Delete as DeleteIcon, AddBox } from '@material-ui/icons';
import { Link } from "react-router-dom";

import Util from './../../Util.js';
import config from 'react-global-configuration';

import Filter from './../modules/Filter.js';
import LoadingOverlay from './../modules/LoadingOverlay.js';

import { connect } from "react-redux";
import { setConfirmDialog, setViewType } from "./../../action";

class ProgressList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      adventures: [],
      status: {
        loading: true
      }
    }
    if(typeof(this.props.limit) == "undefined" || this.props.limit == null) {
      this.limit = 12;
    } else {
      this.limit = this.props.limit;
    }
    if(typeof(this.props.page) == "undefined" || this.props.page == null) {
      this.page = 1;
    } else {
      this.page = this.props.page;
    }
    Util.Auth.check();
  }
  setPage(page) {
    let params = {};
    params['limit'] = this.limit;
    params['page'] = page;
    this.fetch(params);
  }
  fetch(params) {
    let o = this;
    let st = cloneDeep(o.state);
    this.page = params['page'];
    st['page'] = params['page'];
    st['status']['loading'] = true;
    o.setState(st);
    let queryString = "?limit=" + params['limit'] + "&page=" + params['page'];
    axios.get(`${config.get("apiHost")}/me/progress${queryString}`, {})
      .then(res => {
        let ret = Util.processRequestReturnSilent(res);
        if(!ret) {
          return;
        }
        let data = res['data']['data'];
        let adventures = data['adventures'];
        this.pagesTotal = data['pages'];
        let st = cloneDeep(o.state);
        st['adventures'] = adventures;
        st['status']['loading'] = false;
        o.setState(st);
      }).catch(error => {
        Util.displayError("ErrServerResponse");
        o.setState({
          status: {
            loading: false
          }
        });
      });
  }
  componentDidMount() {
    let params = {};
    let o = this;
    
    this.setPage(1);
  }
  renderAdventures() {
    let items = [];
    let adventures = this.state.adventures;

    let layout = Util.generateListBreakpoints(adventures.length, !this.props.pagination);

    for(let i = 0; i < adventures.length; i++) {
      let adventure = adventures[i];
      let themeClassName = "searchItem clickable continue theme default";
      if(adventure['meta']['genre'] != null) {
        themeClassName += " genre-" + adventure['meta']['genre'];
      }

      let mp = layout['default'];
      if(typeof(layout['mapping'][i]) != 'undefined' && layout['mapping'][i] != null) {
        mp = layout['mapping'][i];
      }
      let genreStyle = {
        color: Util.genres[adventure['meta']['genre']]['color']
      };

      items.push(
        <Grid item xs={mp.xs} sm={mp.sm} md={mp.md} lg={mp.lg} xl={mp.xl} key={adventure['_id']}>
          <Box mb={2} className={themeClassName}>
            <Link to={`/a/${adventure['_id']}`} className="link">
              <Paper>
                <div>
                  <div>
                    <h2>{adventure['meta']['title']}</h2>
                    <h3>By {adventure['user']['penName']}</h3>
                    <h4 style={genreStyle}>
                      <Icon className={`fa ${Util.genres[adventure['meta']['genre']]['icon']}`} />
                      &nbsp;
                      {Util.genres[adventure['meta']['genre']]['name']}
                    </h4>
                    <p>{adventure['meta']['description'].trunc(300)}</p>
                  </div>
                </div>
                <div className="decorator" style={genreStyle}><Icon className={`fa ${Util.genres[adventure['meta']['genre']]['icon']}`} /></div>
              </Paper>
            </Link>
          </Box>
        </Grid>
      );
    }

    if(items.length == 0) {
      items.push(
        <Grid item xs={12} sm={12} md={12} lg={6} xl={6} key="nodata">
          <Box mb={2}>
            <div className="nodata">
              <div>
                <div>
                  <h2>You have not gone on any adventures yet</h2>
                </div>
              </div>
              <div className="actions">
                <Link to={`/search/trending/1`} className="link">
                  <Button color="primary" variant="contained">
                    <SearchIcon /> &nbsp; Go on My First Adventure
                  </Button>
                </Link>
              </div>
            </div>
          </Box>
        </Grid>
      );
    }

    return items;
  }
  render() {
    return (
      <div>
        { this.state.adventures.length != 0 &&
          <Grid container spacing={2} justify="space-between">
            <Grid item>
              <Box mb={1}>
                <Link to={`/search/trending/1`} className="link">
                  <Button color="secondary" variant="contained">
                    <SearchIcon /> &nbsp; Find an Adventure
                  </Button>
                </Link>
              </Box>
            </Grid>
            <Grid item>
              <Filter />
            </Grid>
          </Grid>
        }
        <Grid container spacing={2}>
          {this.renderAdventures()}
        </Grid>
        { this.props.pagination && this.pagesTotal > 1 && 
          <div className="paginationHolder">
            <Pagination
              shape="rounded"
              size="large"
              color="primary" 
              page={parseInt(this.page)}
              count={this.pagesTotal}
              onChange={(ev, page) => this.setPage(parseInt(page))}
              renderItem={item => (
                <PaginationItem
                  component={Link}
                  to={`/progress/${item.page}`}
                  {...item}
                />
              )}
            />
          </div>
        }
        <LoadingOverlay loading={this.state.status.loading} />
      </div>
    )
  }
}

const mapStateToProps = state => {
  const props = cloneDeep(state);
  return props;
};
export default connect(mapStateToProps)(ProgressList);