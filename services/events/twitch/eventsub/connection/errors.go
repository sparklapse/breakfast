package connection

import "errors"

var ErrAlreadyConnected = errors.New("socket already connected")
var ErrNotConnected = errors.New("socket not connected")
