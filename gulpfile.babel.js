import gulp from "gulp";
import gpug from "gulp-pug"
import del from "del";
import ws from "gulp-webserver";
import image from "gulp-image";
import sass from "gulp-sass";
import autoprefixer from "gulp-autoprefixer";
import miniCSS from "gulp-csso";
import bro from "gulp-bro";
import babelify from "babelify";
import ghPages from "gulp-gh-pages"

sass.compiler = require("node-sass");

//만약 src를 변경했다고 해보자! 
//콘솔창에 yarn add del 을 사용하여 삭제! 

const routes = {
    pug: {
        watch: "src/**/*.pug",
        //src는 index.pug가 되기 위해 src/*.pug라고 지정하였지만,
        //partials 폴더 안의 footer, header.pug가 변화되는 것도 지켜봐야하므로,
        //watch에는 src/**/*/.pug로 지정하였다.
        src: "src/*.pug",
        //폴더의 안쪽폴더 파일까지 건드리고 싶다면 src/**/*.pug를 입력할것! //
        dest: "build"
        //dest(destination)은 "build"다! 
    },
    img: {
        src: "src/img/*",
        //img 파일에 있는 모든 파일들!
        dest: "build/img"

    },
    scss: {
        watch: "src/scss/**/*.scss",
        src: "src/scss/style.scss",
        dest: "build/css"
    },
    js: {
        watch: "src/js/**/*.js", //모든 js파일을 감시한다.
        src: "src/js/main.js",
        dest: "build/js"
    }
};
//pug는 src에 있고, 이 안의 .pug로 끝나는 모든 파일들을 컴파일하자! 


const pug = () =>
    gulp
    .src(routes.pug.src)
    .pipe(gpug())
    .pipe(gulp.dest(routes.pug.dest));
//gulp의 dest(destination)! 종착점이 dest인 "build"인거야! 

const clean = () => del(["build/", ".publish"]);
//속성이 변할때를 대비해 먼저 초기화하고 build 폴더를 생성한다.
//export const clean = () => del("build")
//clean이라는 변수는 del"build"라는 것을 지운다.

const webserver = () => gulp.src("build").pipe(ws({
    livereload: true
}));
//livereload는 파일을 저장하면 자동으로 새로고침해준다.

const watch = () => {
    gulp.watch(routes.pug.watch, pug);
    //변수routes안에 pug의 watch가 변수pug를 지켜본다.
    gulp.watch(routes.img.src, img);
    gulp.watch(routes.scss.watch, styles, js);
    gulp.watch(routes.js.watch, js);
}

const img = () =>
    gulp
    .src(routes.img.src)
    .pipe(image())
    .pipe(gulp.dest(routes.img.dest));

const styles = () =>
    gulp
    .src(routes.scss.src)
    .pipe(sass().on("error", sass.logError))
    .pipe(autoprefixer())
    //https://github.com/browserslist/browserslist#queries
    //옵션이 먹지 않아서, package.json에 옵션 추가하였다! 
    //last 2 versions은 auto-prefixer의 옵션이다.
    //last 2 versions은 모든 브라우저의 두 단계 아래까지 지원하게끔 한다.
    .pipe(miniCSS()) //여기에도 옵션을 추가할 수 있다. 
    .pipe(gulp.dest(routes.scss.dest));

const js = () =>
    gulp
    .src(routes.js.src)
    .pipe(
        bro({
            transform: [
                babelify.configure({
                    presets: ["@babel/preset-env"]
                }),
                ["uglifyify", {
                    global: true
                }]
            ]
        })
    )
    .pipe(gulp.dest(routes.js.dest));
    
    const gh = () =>gulp.src("build/**/*").pipe(ghPages());
    //모든 폴더와 모든 파일을 적용! 


const prepare = gulp.series([clean, img]);

const assets = gulp.series([pug, styles, js]);

const live = gulp.parallel([webserver, watch]);
//postDev는 웹서버를 실행하고, 파일의 변동사항을 지켜보는 역할을 한다.
//parallel은 두가지를 병행하여 실행하게끔 한다.

export const build = gulp.series([prepare, assets]);
export const dev = gulp.series([build, live]);
export const deploy = gulp.series([build, gh, clean]);

//먼저 clean을 통해 build 폴더를 지우고 , pug를 적용!            
//만약 clean을 exprot 하지 않는다면, 콘솔이나 package.json에서 사용하지 못한다.
//buld는 prepare, assets를 불러오고, 
//dev는 build를 하고, live로 이들을 라이브 서버에서 보여준다.
//deploy는 assets을 build하고, 그것들을 배포한다. 