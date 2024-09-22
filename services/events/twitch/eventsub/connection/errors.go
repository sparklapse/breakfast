package connection

import "errors"

var ErrAlreadyConnected = errors.New("socket already connected")
var ErrNotConnected = errors.New("socket not connected")
var ErrAlreadSubscribed = errors.New("a subscription with that config already exists")
