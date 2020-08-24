# API Documentation

All parameters are considered required unless specified otherwise.

Response for each endpoint assumes success. A response indicating error(s) looks like this:
```yaml
{
  "status": "error",
  "errors": [
    {
      "code": string,
      "target": string (associated passed-in parameter)
    },
    ...
  ]
}
```

## Account Management

### `POST https://api.adventurizer.net/login`

Logs existing user into platform by obtaining a reusable access token to be passed in for every subsequent authenticated API call

**JSON Parameters**
  * email `string`
  * password `string`

**Response**
```yaml
{
  "status": "success",
  "data": {
    "accessToken": string
  }
}
```

### `POST https://api.adventurizer.net/logout`

Logs user out of platform

**Headers**
  * Authorization `string` *accessToken*

**Response**
```yaml
{
  "status": "success"
}
```

### `POST https://api.adventurizer.net/resendConfirmLink`

Resends the email containing the confirmation link to validate a user's email address

**JSON Parameters**
  * email `string`

**Response**
```yaml
{
  "status": "success"
}
```

### `POST https://api.adventurizer.net/forgotPassword`

Sends an email to the user's email address with a link to reset their password in case they forgot their current one

**JSON Parameters**
  * email `string`

**Response**
```yaml
{
  "status": "success"
}
```

### `POST https://api.adventurizer.net/me`

Creates a new user

**JSON Parameters**
  * penName `string`
  * email `string`
  * emailConfirm `string`
  * password `string`
  * passwordConfirm `string`

**Response**
```yaml
{
  "status": "success",
  "data": {
    "userId": string,
    "user": obj
  }
}
```

### `PUT https://api.adventurizer.net/me`

Changes the info of the currently logged-in user

**Headers**
  * Authorization `string` *accessToken*

**JSON Parameters**
  * penName `string`
  * subscribed `string` *whether not to receive emails from adventurizer.net*

**Response**
```yaml
{
  "status": "success"
}
```

### `GET https://api.adventurizer.net/me`

Gets currently logged-in user

**Headers**
  * Authorization `string` *accessToken*

**Response**
```yaml
{
  "status": "success",
  "data": obj
}
```

### `PUT https://api.adventurizer.net/me/password`

Changes the loggedin-in user's password

**Headers**
  * Authorization `string` *accessToken*

**JSON Parameters**
  * password `string` *the current password*
  * passwordNew `string` *the new password*
  * passwordNewConfirm `string` *confirmation of the new password*

**Response**
```yaml
{
  "status": "success"
}
```

### `PUT https://api.adventurizer.net/me/email`

Changes the logged-in user's email

**Headers**
  * Authorization `string` *accessToken*

**JSON Parameters**
  * email `string` *the current email*
  * emailNew `string` *the new email*
  * emailNewConfirm `string` *confirmation of the new email*

**Response**
```yaml
{
  "status": "success"
}
```

## Adventures

### `POST https://api.adventurizer.net/me/adventures`

Creates a new adventure by the logged-in user

**Headers**
  * Authorization `string` *accessToken*

**JSON Parameters**
  * data `obj` *dialogue and option data*
  * view `obj` *view data for builder including zoom and position of both browser window and each individual dialogue*
  * meta `obj` *meta information - name, genre, description, and state*

**Response**
```yaml
{
  "status": "success",
  "data": {
    "adventureId": string,
    "adventure": obj
  }
}
```

### `GET https://api.adventurizer.net/me/adventures`

Gets the list of all adventures created and owned by the logged-in user

**Headers**
  * Authorization `string` *accessToken*

**JSON Parameters**
  * sort `string` *what to sort by (new, trending, popular)*
  * limit `integer` *how many per page*
  * page `integer` *what page*

**Response**
```yaml
{
  "status": "success",
  "data": {
    "adventures": [obj, ...]
  }
}
```

### `GET https://api.adventurizer.net/all/adventures`

Gets the list of all adventures created by all users

**JSON Parameters**
  * sort `string` *what to sort by (new, trending, popular)*
  * limit `integer` *how many per page*
  * page `integer` *what page*

**Response**
```yaml
{
  "status": "success",
  "data": {
    "adventures": [obj, ...]
  }
}
```

### `PUT https://api.adventurizer.net/me/adventures/<adventureId>`

Updates the specified adventure (must have been created by the logged-in user)

**Headers**
  * Authorization `string` *accessToken*

**Parameters**
  * adventureId `string`

**JSON Parameters**
  * data `obj` *dialogue and option data*
  * view `obj` *view data for builder including zoom and position of both browser window and each individual dialogue*
  * meta `obj` *meta information - name, genre, description, and state*

**Response**
```yaml
{
  "status": "success"
}
```

### `GET https://api.adventurizer.net/me/adventures/<adventureId>`

Gets the specified adventure (must have been created by the logged-in user)

**Headers**
  * Authorization `string` *accessToken*

**Parameters**
  * adventureId `string`

**Response**
```yaml
{
  "status": "success",
  "data": {
    "adventure": obj
  }
}
```

### `DELETE https://api.adventurizer.net/me/adventures/<adventureId>`

Deletes the specified adventure and all associated progress (must have been created by the logged-in user)

**Headers**
  * Authorization `string` *accessToken*

**Parameters**
  * adventureId `string`

**Response**
```yaml
{
  "status": "success"
}
```

### `PUT https://api.adventurizer.net/me/adventures/<adventureId>/meta`

Updates the meta data for the specified adventure (must have been created by the logged-in user)

**Headers**
  * Authorization `string` *accessToken*

**Parameters**
  * adventureId `string`

**JSON Parameters**
  * meta `obj` *meta data*

**Response**
```yaml
{
  "status": "success"
}
```

## Adventure Progress

### `GET https://api.adventurizer.net/me/progress`

Fetches a list of all adventures taken by the logged-in user

**Headers**
  * Authorization `string` *accessToken*

**Response**
```yaml
{
  "status": "success",
  "data": {
    "adventures": [obj, ...]
  }
}
```

### `POST https://api.adventurizer.net/me/adventures/<adventureId>/progress`

Creates a new progress item for the logged-in user for a specified adventure

**Headers**
  * Authorization `string` *accessToken*

**Parameters**
  * adventureId `string`

**JSON Parameters**
  * progress `obj` *progress data*

**Response**
```yaml
{
  "status": "success",
  "data": {
    "processId": string,
    "progress": obj
  }
}
```

### `PUT https://api.adventurizer.net/me/adventures/<adventureId>/progress/<progressId>`

Updates the logged-in user's progress on a specified adventure

**Headers**
  * Authorization `string` *accessToken*
  
**Parameters**
  * adventureId `string`
  * progressId `string`

**JSON Parameters**
  * progress `obj` *progress data*

**Response**
```yaml
{
  "status": "success"
}
```