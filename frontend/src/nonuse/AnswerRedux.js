import React from 'react';
import axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { AxiosProvider, Request, Get, Delete, Head, Post, Put, Patch, withAxios } from 'react-axios';
import isEqual from "react-fast-compare";
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {SortableContainer, SortableElement, sortableHandle} from 'react-sortable-hoc';
import { spacing } from '@material-ui/system';
import MuiAlert from '@material-ui/lab/Alert';
import { MuiThemeProvider, Snackbar, CircularProgress, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Box, Drawer, IconButton, ButtonGroup, TextField, Input, InputAdornment, AppBar, Toolbar, Paper, Card, CardActions, CardContent, Grid, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Fab, FormControlLabel, Menu, MenuItem, Typography, CssBaseline } from '@material-ui/core';
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import { createMuiTheme, withStyles } from '@material-ui/core/styles';
import { Visibility, Save, Lock, LockOpen, Add, Edit, Link as LinkIcon, Unlink, Delete as DeleteIcon, Undo, Redo, DragHandle, More, MoreVert, PlayForWork, Flight, MergeType, CallSplit, QuestionAnswerOutlined, QuestionAnswer, Done, AddBox, CheckCircle, Inbox, MenuSharp, Home, ArrowBack } from '@material-ui/icons';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
  withRouter,
  useRouteMatch,
  useParams,
  useHistory
} from "react-router-dom";
import Draggable, {DraggableCore} from 'react-draggable';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import arrayMove from 'array-move';

import Util from '../../Util.js';

import config from 'react-global-configuration';

import { connect } from "react-redux";
import { 
  setConfirmDialog, 
  setQuietAlertDialog,
  setAdventureBuilder,
  setAdventureBuilderQuestion,
  setAdventureBuilderQuestionAnswer
} from "./../../action";

class Answer extends React.Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
  }
  handleDelete() {
    this.props.dispatch(setAdventureBuilderQuestionAnswer(this.props.questionIndex, this.props.index, null));
    //this.props.set(this.props.index, null);
  }
  handleTextUpdate(e) {
    let params = Object.assign({}, this.props.params);
    params['text'] = e.target.value;
    this.props.dispatch(setAdventureBuilderQuestionAnswer(this.props.questionIndex, this.props.index, params));
    //this.props.set(this.props.index, params);
  }
  handleTextSubmit(e) {
    let params = Object.assign({}, this.props.params);
    params['text'] = e.target.value;
    this.props.dispatch(setAdventureBuilderQuestionAnswer(this.props.questionIndex, this.props.index, params));
    //this.props.set(this.props.index, params);
  }
  startLink(e) {
    let params = {};
    params['from'] = this.props.questionIndex + "," + this.props.index;
    params['preview'] = true;
    //this.props.setLink(params);
  }
  componentDidUpdate() {
    let params = Object.assign({}, this.props.params);
    if(params['element'] == null) {
      params['element'] = this.myRef.current;
      this.props.dispatch(setAdventureBuilderQuestionAnswer(this.props.questionIndex, this.props.index, params));
      //this.props.set(this.props.index, params);
    }
  }
  /*
  shouldComponentUpdate(nextProps, nextState) {
    return this.props.params.element == null || !isEqual(this.props.params, nextProps.params);
  }
  */
  render() {
    let color = this.props.params.linkedTo != null ? "secondary" : "primary";
    let classNames = "answerInput";
    if(this.props.params.linkedTo != null) {
      //classNames += " linked"
    }
    let SortHandle = sortableHandle(() => 
      <IconButton
        className="handle" 
        edge="start"
        size="small">
        <DragHandle />
      </IconButton>
    );
    return (
      <div>
        <TextField
          className={classNames}
          size="small"
          color={color}
          multiline
          fullWidth
          onChange={(event) => this.handleTextUpdate(event)}
          onBlur={(event) => this.handleTextSubmit(event)}
          value={this.props.params.text}
          placeholder="Choice"
          InputProps={{
            startAdornment:
              <InputAdornment position="start">
                <SortHandle />
              </InputAdornment>,
            endAdornment:
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => this.handleDelete()}
                >
                  <DeleteIcon />
                </IconButton>
                <Fab
                  edge="end"
                  size="small"
                  color={color}
                  onClick={(event) => this.startLink(event)}
                >
                  <LinkIcon />
                  <div ref={this.myRef} className="answerPoint"></div>
                </Fab>
              </InputAdornment>
          }}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  //const props = cloneDeep(state.builder.questions[ownProps.questionIndex].answers[ownProps.index]);
  const props = Object.assign({}, state.builder.questions[ownProps.questionIndex].answers[ownProps.index]);
  return props;
};

export default connect(mapStateToProps)(Answer);