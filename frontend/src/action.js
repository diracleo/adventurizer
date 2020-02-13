export const TOGGLE_MAIN_MENU = 'TOGGLE_MAIN_MENU';
export const SET_CONFIRM_DIALOG = 'SET_CONFIRM_DIALOG';
export const SET_QUIET_ALERT_DIALOG = 'SET_QUIET_ALERT_DIALOG';
export const SET_VIEW_TYPE = 'SET_VIEW_TYPE';

//defunct
export const SET_ADVENTURE_BUILDER = 'SET_ADVENTURE_BUILDER';
export const SET_ADVENTURE_BUILDER_QUESTION = 'SET_ADVENTURE_BUILDER_QUESTION';
export const SET_ADVENTURE_BUILDER_QUESTION_ANSWER = 'SET_ADVENTURE_BUILDER_QUESTION_ANSWER';


export function toggleMainMenu(value) {
  return { type: TOGGLE_MAIN_MENU, toggle: value }
}
export function setConfirmDialog(value) {
  return { type: SET_CONFIRM_DIALOG, settings: value }
}
export function setQuietAlertDialog(value) {
  return { type: SET_QUIET_ALERT_DIALOG, settings: value }
}
export function setViewType(value) {
  return { type: SET_VIEW_TYPE, toggle: value }
}

//defunct
export function setAdventureBuilder(value) {
  return { type: SET_ADVENTURE_BUILDER, settings: value }
}
export function setAdventureBuilderQuestion(questionId, value) {
  return { type: SET_ADVENTURE_BUILDER_QUESTION, questionId: questionId, params: value }
}
export function setAdventureBuilderQuestionAnswer(questionId, answerId, value) {
  return { type: SET_ADVENTURE_BUILDER_QUESTION_ANSWER, questionId: questionId, answerId: answerId, params: value }
}