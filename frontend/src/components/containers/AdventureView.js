import React from 'react';
import axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { AxiosProvider, Request, Get, Delete, Head, Post, Put, Patch, withAxios } from 'react-axios';
import isEqual from "react-fast-compare";
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Grid, Box, Typography } from '@material-ui/core';
import { ArrowForward, ArrowBack } from '@material-ui/icons';
import { Link } from "react-router-dom";

import config from 'react-global-configuration';
import Util from './../../Util.js';

import { connect } from "react-redux";
import { setViewType } from "./../../action";

import SnugText from './../modules/SnugText.js';
import LoadingOverlay from './../modules/LoadingOverlay.js';

class AdventureView extends React.Component {
  constructor(props) {
    super(props);
    this.props.dispatch(setViewType("fullscreen"));

    Util.Auth.check();

    let adventureId = null;

    if(typeof(this.props.adventureId) != 'undefined' && this.props.adventureId != null) {
      adventureId = this.props.adventureId;
    }

    this.minFontSize = 16;
    this.maxFontSize = 40;

    this.state = {
      fontSize: 14,
      answersShow: false,
      adventureId: adventureId,
      user: {
        _id: "",
        penName: ""
      },
      questions: {},
      progress: {
        history: [],
        current: null
      },
      metaDialogOpen: false,
      meta: {
      },
      status: {
        saved: true,
        loading: true
      }
    }
  }

  componentDidMount() {
    let adventureId = this.state.adventureId;
    let params = {};
    let o = this;
    axios.get(`${config.get("apiHost")}/api/adventure/${adventureId}`, params)
      .then(res => {
        let ret = Util.processRequestReturnSilent(res);
        if(!ret) {
          return;
        }
        let data = res['data']['data'];
        let adventure = data['adventure'];

        let questions = adventure['data'];
        
        let progress = {
          history: [{
            questionId: null
          }],
          current: null
        };

        let progressId = null;
        
        console.log(progress);

        if(data['progress']) {
          progress = data['progress'];
          progressId = data['progressId'];
        }
        o.setState({
          status: {
            loading: false
          },
          user: adventure['user'],
          meta: {
            title: adventure['meta']['title'],
            description: adventure['meta']['description'],
            theme: adventure['meta']['theme']
          },
          questions: questions,
          progress: progress,
          progressId: progressId
        });
      });
    
    window.addEventListener('resize', () => {
      this.setState({
        answersShow: false
      })
    });
  }

  componentDidUpdate() {
    if(this.state.answersShow == false) {
      window.dispatchEvent(new Event('resize'));
    }
  }

  setFontSize(fontSize) {
    this.setState({
      fontSize: fontSize,
      answersShow: true
    });
  }

  goTo(k) {
    let o = this;

    o.setState({
      status: {
        loading: true
      }
    });

    let progress = cloneDeep(this.state.progress);
    progress.history.push({
      questionId: k
    });
    progress.current = progress.history.length - 1;

    let adventureId = this.state.adventureId;
    let progressId = this.state.progressId;
    let params = {
      "progress": progress
    };
    
    axios.put(`${config.get("apiHost")}/api/adventure/${adventureId}/progress/${progressId}`, params)
      .then(res => {
        let ret = Util.processRequestReturnSilent(res);
        if(!ret) {
          return;
        }
        this.setState({
          progress: progress,
          progressId: progressId,
          answersShow: false,
          status: {
            loading: false
          }
        });
      });
  }

  back() {
    let o = this;

    o.setState({
      status: {
        loading: true
      }
    });

    let progress = cloneDeep(this.state.progress);
    progress.history.pop();
    progress.current = progress.history.length - 1;

    let adventureId = this.state.adventureId;
    let progressId = this.state.progressId;
    let params = {
      "progress": progress
    };
    
    axios.put(`${config.get("apiHost")}/api/adventure/${adventureId}/progress/${progressId}`, params)
      .then(res => {
        let ret = Util.processRequestReturnSilent(res);
        if(!ret) {
          return;
        }
        this.setState({
          progress: progress,
          progressId: progressId,
          answersShow: false,
          status: {
            loading: false
          }
        });
      });
  }

  startAdventure() {

    let o = this;

    o.setState({
      status: {
        loading: true
      }
    });

    let adventureId = this.state.adventureId;
    let params = {};
    
    axios.post(`${config.get("apiHost")}/api/adventure/${adventureId}/progress`, params)
      .then(res => {
        let ret = Util.processRequestReturnSilent(res);
        if(!ret) {
          return;
        }
        let data = res['data']['data'];
        let progress = data['progress'];
        let progressId = data['progressId'];
        console.log(progressId);
        //this.goTo(current);
        o.setState({
          status: {
            loading: false
          },
          progressId: progressId,
          progress: progress,
          answersShow: false
        });
      });
  }

  startOver() {
    let progress = cloneDeep(this.state.progress);
    progress.history = [];
    progress.current = null;
    this.setState({
      progress: progress
    });
  }

  renderAnswers(answers) {
    let items = [];
    let answerStyle = {
      fontSize: ""+this.state.fontSize+"px"
    };
    //console.log(answers);
    for(let i in answers) {
      let k = answers[i]['linkedTo'];
      if(k != null) {
        items.push(
          <div className="answer" key={i} style={answerStyle} onClick={() => this.goTo(k)}>
            <span>{answers[i]['text']}</span>
          </div>
        );
      }
    }

    if(items.length == 0) {
      items.push(
        <div className="answer restart" key="answerRestart" style={answerStyle} onClick={() => this.startOver()}>
          <span>Start Over</span>
        </div>
      );
      if(!Util.Auth.isAuthenticated) {
        items.push(
          <a className="answer todo" key="loginCallBtn" href={`/login`}>
            Sign In to Save Your Progress
          </a>
        );
      }
      items.push(
        <a className="answer todo" key="moreFromCallBtn" href={`/u/${this.state.user._id}`}>
          More from {this.state.user.penName}
        </a>
      );
    }

    items.push(
      <div className="answer back" key="answerBack" style={answerStyle} onClick={() => this.back()}>
        <span><ArrowBack /> &nbsp; Back</span>
      </div>
    );

    return items;
  }
  render() {
    let current = null;
    if(typeof(this.state.progress.history[this.state.progress.current]) != 'undefined') {
      current = this.state.progress.history[this.state.progress.current];
      current = current.questionId;
    }
    let question = null;
    let meta = null;
    if(current != null && typeof(this.state.questions[current]) != 'undefined') {
      question = this.state.questions[current];
    } else if(typeof(this.state.meta.title) != 'undefined') {
      meta = this.state.meta;
    }

    let allText = null;
    if(question != null) {
      allText += question.text;
      allText += '<div class="answers">';
        let j = 0;
        for(let i in question.answers) {
          let k = question.answers[i]['linkedTo'];
          if(k != null) {
            allText += '<div class="answer"><span>' + question.answers[i]['text'] + '</span></div>';
            j++;
          }
        }
        if(j == 0) {
          allText += '<div class="answer restart">Start Over</div>';
          if(!Util.Auth.isAuthenticated) {
            allText += '<a class="answer back">Sign In to Save Your Progress</a>';
          }
          allText += '<a class="answer todo">More from ' + this.state.user.penName + '</a>';
        }
        allText += '<div class="answer todo">Back</div>';
      allText += '</div>';
    } else if(meta != null) {
      allText = '<span class="title"><span>' + meta.title + '</span><span>By ' + this.state.user.penName + '</span></span>';
      allText += '<div class="description">' + meta.description + '</div>';
      allText += '<div class="answers metaAnswers">';
        allText += '<div class="answer"><span>Begin</span></div>';
      allText += '</div>';
    }

    let maxHeight = "100%";
    let height = "100vh";
    if(this.state.fontSize == this.minFontSize) {
      maxHeight = null;
      height = null;
    }

    let answersStyle = {};
    if(this.state.answersShow) {
      answersStyle.display = "block";
      answersStyle.fontSize = ""+this.state.fontSize+"px";
    } else {
      answersStyle.display = "none";
    }

    let themeClassName = "contentFullScreen theme default";
    if(this.state.meta != null) {
      themeClassName = "contentFullScreen theme " + this.state.meta.theme;
    }

    return (
      <div className={themeClassName}>
        <div className="view">
          <div>
            { question == null && meta != null &&
              <div className="item">
                <div className="question">
                  <span className="title" style={answersStyle}>
                    <span>{meta.title}</span>
                    <span>By {this.state.user.penName}</span>
                  </span>
                  <SnugText testText={allText} text={meta.description} fontSize={this.state.fontSize} maxFontSize={this.maxFontSize} minFontSize={this.minFontSize} maxHeight={maxHeight} callback={(fontSize) => this.setFontSize(fontSize)} />
                  <div className="answers metaAnswers" style={answersStyle}>
                    <div className="answer" onClick={() => this.startAdventure()}><span>Begin &nbsp; <ArrowForward /></span></div>
                  </div>
                </div>
              </div>
            }
            { question != null &&
              <div className="item">
                <div className="question">
                  <SnugText testText={allText} text={question.text} fontSize={this.state.fontSize} maxFontSize={this.maxFontSize} minFontSize={this.minFontSize} maxHeight={maxHeight} callback={(fontSize) => this.setFontSize(fontSize)} />
                  <div className="answers" style={answersStyle}>
                    {this.renderAnswers(question.answers)}
                  </div>
                </div>
              </div>
            }
          </div>
          <div className="navbar">
            <Grid
              justify="space-between"
              container>
              <Grid item xs={6}>
                <Box display="flex" alignItems="left">
                  { !Util.Auth.isAuthenticated &&
                    <a className="moreLink" href={`/login`}>
                      Sign In to Save Your Progress
                    </a>
                  }
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box display="flex" alignItems="right">
                  <div className="poweredBy">
                    Powered by 
                    <a className="logoLink" href="/">
                      <Typography variant="h1" className="logo">
                        ADVENTURIZER
                      </Typography>
                    </a>
                  </div>
                </Box>
              </Grid>
            </Grid>
          </div>
          <LoadingOverlay loading={this.state.status.loading} />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const adventureView = Object.assign({}, state.adventureView);
  return adventureView;
};

export default connect(mapStateToProps)(AdventureView);