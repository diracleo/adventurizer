import React from 'react';
import cloneDeep from 'lodash/cloneDeep';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Grid, Box, Button } from '@material-ui/core';
import { Launch, PersonAdd } from '@material-ui/icons';
import { Link } from "react-router-dom";
import Util from './../../Util.js';
import config from 'react-global-configuration';

import MyAdventuresList from './../modules/MyAdventuresList.js';
import MyProgressList from './../modules/MyProgressList.js';
import AdventuresList from './../modules/AdventuresList.js';
import LoadingOverlay from './../modules/LoadingOverlay.js';
import Footer from './../modules/Footer.js';

import { connect } from "react-redux";
import { setConfirmDialog, setViewType } from "./../../action";

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      search: [],
      status: {
        loading: true
      }
    }
    this.props.dispatch(setViewType("normal"));

    Util.Auth.check();
  }
  renderGenreDecorators() {
    let genres = Util.genres;
    let ret = [];
    let num = Object.keys(genres).length;
    let minusNum = 400 / num;

    let count = 0;
    for(let i in genres) {
      let fs = "calc(" + Math.round(80 / num) + "vw - " + minusNum + "px + " + (count * 20) +"px)";
      let op = 1 - (count / (num + 2));
      let genreStyle = {
        color: "#ffffff",
        fontSize: fs,
        opacity: op
      };
      ret.push(
        <div className="genreIcon" key={`genreIcon-${count}`}>
          <i className={`fa ${genres[i]['icon']}`} style={genreStyle}></i>
        </div>
      );
      count++;
    }
    return ret;
  }
  render() {
    return (
      <div className="wrappedOuter">
        <div className="wrapped">
          <div className="content contentFilled">
            { !Util.Auth.isAuthenticated && 
              <div className="widget widgetEdge">
                <div className="promo">
                  <div>
                    <h1>
                      Build your own adventures
                      <br/>
                      Discover new adventures
                    </h1>
                    <Link to={`/signup`} className="link">
                      <Button color="primary" variant="contained" size="large">
                        <PersonAdd />
                        &nbsp;
                        Create Free Account
                      </Button>
                    </Link>
                  </div>
                  <div className="decorator">
                    {this.renderGenreDecorators()}
                  </div>
                </div>
              </div>
            }
            { Util.Auth.isAuthenticated && 
              <div className="widget">
                <div className="header">
                  <Grid
                    justify="space-between"
                    container>
                    <Grid item md={6}>
                      <Box display="flex" alignItems="left">
                        <h2>
                          <Link to={`/adventures`} className="link">My Adventures</Link>
                        </h2>
                      </Box>
                    </Grid>
                    <Grid item md={6}>
                      <Box display="flex" alignItems="right" className="actions">
                        <Link to={`/adventures`} className="link">
                          <Button color="primary">
                            See All
                            &nbsp;
                            <Launch fontSize="small" />
                          </Button>
                        </Link>
                      </Box>
                    </Grid>
                  </Grid>
                </div>
                <div className="area">
                  <MyAdventuresList pagination={false} limit={4} />
                </div>
              </div>
            }
            { Util.Auth.isAuthenticated && 
              <div className="widget">
                <div className="header">
                  <Grid
                    justify="space-between"
                    container>
                    <Grid item md={6}>
                      <Box display="flex" alignItems="left">
                        <h2>
                          <Link to={`/progress`} className="link">My Progress</Link>
                        </h2>
                      </Box>
                    </Grid>
                    <Grid item md={6}>
                      <Box display="flex" alignItems="right" className="actions">
                        <Link to={`/progress`} className="link">
                          <Button color="primary">
                            See All
                            &nbsp;
                            <Launch fontSize="small" />
                          </Button>
                        </Link>
                      </Box>
                    </Grid>
                  </Grid>
                </div>
                <div className="area">
                  <MyProgressList pagination={false} limit={4} />
                </div>
              </div>
            }
            { typeof(this.state.search) != 'undefined' && 
              <div className="widget">
                <div className="header">
                  <Grid
                    justify="space-between"
                    container>
                    <Grid item md={6}>
                      <Box display="flex" alignItems="left">
                        <h2>
                          <Link to={`/search/trending/1`} className="link">Explore Adventures</Link>
                        </h2>
                      </Box>
                    </Grid>
                    <Grid item md={6}>
                      <Box display="flex" alignItems="right" className="actions">
                        <Link to={`/search/trending/1`} className="link">
                          <Button color="primary">
                            See All
                            &nbsp;
                            <Launch fontSize="small" />
                          </Button>
                        </Link>
                      </Box>
                    </Grid>
                  </Grid>
                </div>
                <div className="area">
                  <AdventuresList sort="trending" page={1} pagination={false} limit={8} />
                </div>
              </div>
            }
          </div>
        </div>
        <Footer type="padded" />
      </div>
    );
  }
}

const mapStateToProps = state => {
  const props = cloneDeep(state);
  return props;
};
export default connect(mapStateToProps)(Dashboard);