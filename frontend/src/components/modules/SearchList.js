import React from 'react';
import axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { AxiosProvider, Request, Get, Delete, Head, Post, Put, Patch, withAxios } from 'react-axios';
import isEqual from "react-fast-compare";
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Pagination } from '@material-ui/lab';
import PaginationItem from '@material-ui/lab/PaginationItem';
import { MuiThemeProvider, Snackbar, CircularProgress, Button, ButtonGroup, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Box, Drawer, IconButton, TextField, Input, InputAdornment, AppBar, Toolbar, Paper, Card, CardActions, CardContent, Grid, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Fab, FormControlLabel, Menu, MenuItem, Typography, CssBaseline } from '@material-ui/core';
import { Visibility, Edit, Delete as DeleteIcon, AddBox } from '@material-ui/icons';
import { Link, withRouter, BrowserRouter as Router } from "react-router-dom";

import Util from './../../Util.js';
import config from 'react-global-configuration';

import LoadingOverlay from './../modules/LoadingOverlay.js';

import { connect } from "react-redux";
import { setConfirmDialog, setViewType } from "./../../action";

class SearchList extends React.Component {
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
    if(typeof(this.props.sort) == "undefined" || this.props.sort == null) {
      this.sort = "trending";
    } else {
      this.sort = this.props.sort;
    }
    if(typeof(this.props.page) == "undefined" || this.props.page == null) {
      this.page = 1;
    } else {
      this.page = this.props.page;
    }
    Util.Auth.check();
  }
  setSort(type) {
    this.page = 1;
    let params = {};
    params['sort'] = type;
    params['limit'] = this.limit;
    params['page'] = this.page;
    this.fetch(params);
  }
  setPage(page) {
    let params = {};
    params['sort'] = this.sort;
    params['limit'] = this.limit;
    params['page'] = page;
    this.fetch(params);
  }
  fetch(params) {
    let o = this;
    let st = cloneDeep(o.state);
    this.sort = params['sort'];
    this.page = params['page'];
    st['sort'] = params['sort'];
    st['page'] = params['page'];
    st['status']['loading'] = true;
    o.setState(st);
    let queryString = "?sort=" + params['sort'] + "&limit=" + params['limit'] + "&page=" + params['page'];
    axios.get(`${config.get("apiHost")}/adventure/search${queryString}`, {})
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
      });
  }
  componentDidMount() {
    let params = {};
    let o = this;
    
    this.setSort(this.sort);
  }
  renderAdventures() {
    let items = [];
    let adventures = this.state.adventures;
    let layout = Util.generateListBreakpoints(adventures.length, !this.props.pagination);

    for(let i = 0; i < adventures.length; i++) {
      let adventure = adventures[i];
      let themeClassName = "searchItem clickable theme default";
      themeClassName = "searchItem clickable theme " + adventure['meta']['theme'];

      let mp = layout['default'];
      if(typeof(layout['mapping'][i]) != 'undefined' && layout['mapping'][i] != null) {
        mp = layout['mapping'][i];
      }

      items.push(
        <Grid item xs={mp.xs} sm={mp.sm} md={mp.md} lg={mp.lg} xl={mp.xl} key={adventure['_id']}>
          <Box mb={2} className={themeClassName}>
            <Link to={`/a/${adventure['_id']}`} className="link">
              <Paper>
                <div>
                  <div>
                    <h2>{adventure['meta']['title']}</h2>
                    <h3>By {adventure['user']['penName']}</h3>
                    <p>{adventure['meta']['description'].trunc(300)}</p>
                  </div>
                </div>
              </Paper>
            </Link>
          </Box>
        </Grid>
      );
    }
    return items;
  }
  renderActionsBar() {
    if(this.props.pagination) {
      return (
        <div className="searchActionBar" key="searchActionBar">
          <Router>
            <Link to={`/search/trending/1`} className="link">
              <Button color="primary" variant={this.sort == "trending" ? "contained" : "outlined"} onClick={() => this.setSort("trending")}>Trending</Button>
            </Link>
            <Link to={`/search/popular/1`} className="link">
              <Button color="primary" variant={this.sort == "popular" ? "contained" : "outlined"} onClick={() => this.setSort("popular")}>Popular</Button>
            </Link>
            <Link to={`/search/newest/1`} className="link">
              <Button color="primary" variant={this.sort == "newest" ? "contained" : "outlined"} onClick={() => this.setSort("newest")}>Newest</Button>
            </Link>
          </Router>
        </div>
      );
    } else {
      return (
        <ButtonGroup color="primary" aria-label="outlined primary button group" key="searchActionBar">
          <Button variant={this.sort == "trending" ? "contained" : "outlined"} onClick={() => this.setSort("trending")}>Trending</Button>
          <Button variant={this.sort == "popular" ? "contained" : "outlined"} onClick={() => this.setSort("popular")}>Popular</Button>
          <Button variant={this.sort == "newest" ? "contained" : "outlined"} onClick={() => this.setSort("newest")}>Newest</Button>
        </ButtonGroup>
      );
    }
  }
  render() {
    return (
      <div>
        <Box mb={2}>
          {this.renderActionsBar()}
        </Box>
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
                  to={`/search/${this.sort}/${item.page}`}
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
export default withRouter(connect(mapStateToProps)(SearchList));