import React from 'react';
import axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { AxiosProvider, Request, Get, Delete, Head, Post, Put, Patch, withAxios } from 'react-axios';
import isEqual from "react-fast-compare";
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import MuiAlert from '@material-ui/lab/Alert';
import { Pagination } from '@material-ui/lab';
import PaginationItem from '@material-ui/lab/PaginationItem';
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import { Chip, Icon, FormControl, InputLabel, Select, MuiThemeProvider, Snackbar, CircularProgress, Button, ButtonGroup, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Box, Drawer, IconButton, TextField, Input, InputAdornment, AppBar, Toolbar, Paper, Card, CardActions, CardContent, Grid, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Fab, FormControlLabel, Menu, MenuItem, Typography, CssBaseline } from '@material-ui/core';
import { TrendingUp, People, Schedule, Share, Visibility, Edit, Delete as DeleteIcon, AddBox, FilterList } from '@material-ui/icons';
import { Link } from "react-router-dom";

import Util from './../../Util.js';
import config from 'react-global-configuration';

import Filter from './../modules/Filter.js';
import GenreSelector from './../modules/GenreSelector.js';
import LoadingOverlay from './../modules/LoadingOverlay.js';

import { connect } from "react-redux";
import { setConfirmDialog, setViewType } from "./../../action";

class MyAdventuresList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      metaDialogOpen: false,
      meta: null,
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
  deleteAdventure(adventureId) {
    let params = {};
    let o = this;
    this.props.dispatch(setConfirmDialog({
      "title": "Delete this adventure?",
      "description": "This action cannot be undone.",
      "open": true,
      "confirmCallback": function() {
        o.setState({
          status: {
            loading: true
          }
        });
        axios.delete(`${config.get("apiHost")}/me/adventures/${adventureId}`, params)
          .then(res => {
            let ret = Util.processRequestReturnSilent(res);
            if(!ret) {
              o.setState({
                status: {
                  loading: false
                }
              });
              return;
            }
            params = {};
            axios.get(`${config.get("apiHost")}/me/adventures`, params)
              .then(res => {
                let ret = Util.processRequestReturnSilent(res);
                if(!ret) {
                  o.setState({
                    status: {
                      loading: false
                    }
                  });
                  return;
                }
                let data = res['data']['data'];
                let adventures = data['adventures'];
                o.setState({
                  adventures: adventures,
                  status: {
                    loading: false
                  }
                });
              }).catch(error => {
                Util.displayError("ErrServerResponse");
                o.setState({
                  status: {
                    loading: false
                  }
                });
              });
          }).catch(error => {
            Util.displayError("ErrServerResponse");
            o.setState({
              status: {
                loading: false
              }
            });
          });
      }
    }));
  }
  shareAdventure(adventureId) {
    window.FB.ui({
      method: 'share',
      href: config.get("apiHost") + "/all/adventures/" + adventureId + "?mode=share",
    }, function(response){});
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
    axios.get(`${config.get("apiHost")}/me/adventures${queryString}`, {})
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
  editMeta(adventureId) {
    let chosenAdventure = null;
    for(let i = 0; i < this.state.adventures.length; i++) {
      let adventure = this.state.adventures[i];
      if(adventure['_id'] == adventureId) {
        chosenAdventure = adventure;
        break;
      }
    }
    if(chosenAdventure != null) {
      this.metaAdventureId = adventureId;
      let meta = cloneDeep(chosenAdventure['meta']);
      for(let i in meta) {
        meta[i] = {
          value: meta[i],
          error: null
        };
      }
      this.setState({
        metaDialogOpen: true,
        meta: meta
      });
    }
  }

  setMeta(key, value) {
    let st = cloneDeep(this.state.meta);
    st[key]['error'] = null;
    st[key]['value'] = value;

    this.setState({
      meta: st
    });
  }

  saveMeta() {
    let params = {};
    params['meta'] = {
      title: this.state.meta.title.value,
      state: this.state.meta.state.value,
      description: this.state.meta.description.value,
      genre: this.state.meta.genre.value
    }
    let o = this;
    o.setState({
      status: {
        loading: true
      }
    });
    axios.put(`${config.get("apiHost")}/me/adventures/${this.metaAdventureId}/meta`, params)
      .then(res => {
        Util.processRequestReturn(res, o, "SuccAdventureSaved");
        if(res['data']['status'] == "success") {
          o.setState({
            metaDialogOpen: false
          });
          o.fetch({
            limit: this.limit,
            page: this.page
          });
        }
      }).catch(error => {
        Util.displayError("ErrServerResponse");
        o.setState({
          status: {
            loading: false
          }
        });
      });
  }

  handleMetaDialogOpen() {
    this.setState({
      metaDialogOpen: true
    });
  }

  handleMetaDialogClose() {
    this.setState({
      metaDialogOpen: false
    });
  }

  handleMetaDialogSaveAndClose() {
    this.saveMeta();
  }

  handleGenreChange(event) {
    this.setMeta("genre", event.target.value);
  };

  handleStateChange(event) {
    this.setMeta("state", event.target.value);
  };

  componentDidMount() {
    let params = {};
    let o = this;
    Util.loadFacebookAPI();
    this.setPage(1);
  }
  renderAdventures() {
    let items = [];
    let adventures = this.state.adventures;

    //figure out grid layout
    let layout = Util.generateListBreakpoints(adventures.length, !this.props.pagination);

    for(let i = 0; i < adventures.length; i++) {
      let adventure = adventures[i];

      let themeClassName = "searchItem theme default";
      if(adventure['meta']['genre'] != null) {
        themeClassName += " genre-" + adventure['meta']['genre'];
      }
      
      let mp = layout['default'];
      if(typeof(layout['mapping'][i]) != 'undefined' && layout['mapping'][i] != null) {
        mp = layout['mapping'][i];
      }
      let stateButtonColor = "default";
      if(adventure['meta']['state'] == "public") {
        stateButtonColor = "primary";
      }
      let genreStyle = {
        color: Util.genres[adventure['meta']['genre']]['color']
      };
      let chipStyle = {
        marginBottom: "10px",
        marginRight: "10px"
      }

      let takenLabel = "times";
      if(adventure['progressStats']['takenCount'] == 1) {
        takenLabel = "time";
      }
      let usersTakenLabel = "adventurers";
      if(adventure['progressStats']['usersTakenCount'] == 1) {
        usersTakenLabel = "adventurer";
      }

      items.push(
        <Grid item xs={mp.xs} sm={mp.sm} md={mp.md} lg={mp.lg} xl={mp.xl} key={adventure['_id']}>
          <Box mb={2} className={themeClassName}>
            <Paper>
              <div>
                <div>
                  <Link to={`/a/${adventure['_id']}`} className="link">
                    <h2>{adventure['meta']['title']}</h2>
                    <h3>By {adventure['user']['penName']}</h3>
                    <h4 style={genreStyle}>
                      <Icon className={`fa ${Util.genres[adventure['meta']['genre']]['icon']}`} />
                      &nbsp;
                      {Util.genres[adventure['meta']['genre']]['name']}
                    </h4>
                  </Link>
                  <p>{adventure['meta']['description'].trunc(300)}</p>
                  <div>
                    <Chip label={`Taken ${adventure['progressStats']['takenCount']} ${takenLabel} by ${adventure['progressStats']['usersTakenCount']} ${usersTakenLabel}`} variant="outlined" icon={<TrendingUp />} style={chipStyle} />
                  </div>
                </div>
              </div>
              <div className="actions">
                <Button color={stateButtonColor} variant="contained" onClick={(adventureId) => {
                  this.editMeta(adventure['_id'])
                }}>
                  {adventure['meta']['state']}
                </Button>
                &nbsp;
                <Link to={`/a/${adventure['_id']}`} className="link">
                  <Button color="primary" variant="contained">
                    <Visibility />
                  </Button>
                </Link>
                <Button color="primary" variant="contained" onClick={(adventureId) => {
                  this.shareAdventure(adventure['_id'])
                }}>
                  <Share />
                </Button>
                <PopupState variant="popover" popupId="card-popup-menu">
                  {popupState => (
                    <React.Fragment>
                      <Button color="primary" variant="contained" {...bindTrigger(popupState)}>
                        <Edit />
                      </Button>
                      <Menu {...bindMenu(popupState)} color="primary">
                        <MenuItem onClick={(adventureId) => {
                          this.editMeta(adventure['_id']);
                          popupState.close();
                        }}>
                          Edit Meta Data
                        </MenuItem>
                        <MenuItem>
                          <Link to={`/adventures/build/${adventure['_id']}`} className="link">
                            Enter the Builder
                          </Link>
                        </MenuItem>
                      </Menu>
                    </React.Fragment>
                  )}
                </PopupState>
                <Button color="primary" variant="contained" onClick={(adventureId) => {
                  this.deleteAdventure(adventure['_id'])
                }}>
                  <DeleteIcon />
                </Button>
              </div>
              <div className="decorator" style={genreStyle}><Icon className={`fa ${Util.genres[adventure['meta']['genre']]['icon']}`} /></div>
            </Paper>
          </Box>
        </Grid>
      );
    }

    if(items.length == 0) {
      items.push(
        <Grid item xs={12} sm={12} md={9} lg={6} xl={6} key="nodata">
          <Box mb={2}>
            <div className="nodata">
              <div>
                <div>
                  <h2>You have not created any adventures yet</h2>
                  <p>Click the button below to get started</p>
                </div>
              </div>
              <div className="actions">
                <Link to={`/adventures/build`} className="link">
                  <Button color="primary" variant="contained">
                    <AddBox /> &nbsp; Build My First Adventure
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
                <Link to={`/adventures/build`} className="link">
                  <Button color="secondary" variant="contained">
                    <AddBox /> &nbsp; Build An Adventure
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
                  to={`/adventures/${item.page}`}
                  {...item}
                />
              )}
            />
          </div>
        }
        { this.state.meta != null && 
          <Dialog open={this.state.metaDialogOpen} onClose={() => this.handleMetaDialogClose()}>
            <DialogContent>
              <Grid container>
                <Grid item xs={12}>
                  <Box mb={3}>
                    <TextField id="fieldAdventureTitle" label="Name of Adventure" required type="text" fullWidth
                      value={this.state.meta.title.value}
                      error={this.state.meta.title.error != null}
                      helperText={this.state.meta.title.error}
                      onChange={e => this.setMeta("title", e.target.value)}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box mb={3}>
                    <FormControl fullWidth>
                      <InputLabel id="fieldAdventureThemeLabel">State</InputLabel>
                      <Select
                        className="stateSelector"
                        labelId="fieldAdventureStateLabel"
                        id="fieldAdventureState"
                        value={this.state.meta.state.value}
                        onChange={e => this.handleStateChange(e)}
                      >
                        <MenuItem value="draft">
                          Draft
                        </MenuItem>
                        <MenuItem value="public">
                          Public
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box mb={3}>
                    <GenreSelector 
                      value={this.state.meta.genre.value}
                      onChange={e => this.handleGenreChange(e)}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box mb={3}>
                    <TextField id="fieldAdventureDescription" label="Description" type="text" fullWidth multiline
                      value={this.state.meta.description.value}
                      error={this.state.meta.description.error != null}
                      helperText={this.state.meta.description.error}
                      onChange={e => this.setMeta("description", e.target.value)}
                    />
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => this.handleMetaDialogSaveAndClose()} color="primary">
                Save
              </Button>
            </DialogActions>
          </Dialog>
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
export default connect(mapStateToProps)(MyAdventuresList);