const gulp = require('gulp');
const gulpMocha = require('gulp-mocha');
const istanbul = require('gulp-istanbul');


gulp.task('serve', () => {
 require('./index.js');
});


gulp.task('test', () => {
    return gulp.src(['controllers/*.js', 'models/*.js'])
       .pipe(istanbul())
        .on('end', () => {
            gulp.src('tests/**/*.js')
                .pipe(gulpMocha({
                  reporter: 'spec'
                }))
                .pipe(istanbul.writeReports('reports')); 
    });
});




