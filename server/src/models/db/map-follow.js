'use strict';

module.exports = (sequelize, type) => {
    return sequelize.define('mapfollows', {
        notifyOn: {
            type: type.TINYINT.UNSIGNED,
        }
    })
}