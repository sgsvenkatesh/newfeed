/**
 * Created by sgsvenkatesh on 10/11/15.
 */

function convertNameToParam(string) {
    return encodeURIComponent(string
        .split(" ").join("-")
        .split("\"").join("")
        .split("\'").join("").toLowerCase());
}

function getLove(title) {
    return JSON.parse(localStorage.getItem(convertNameToParam(title)));
}

function setLove(thisLoveIcon, title, isLoved) {
    localStorage.setItem(convertNameToParam(title), isLoved);
    $(thisLoveIcon).find("i").toggleClass("fa-heart").toggleClass("fa-heart-o");
}

function createContentWidget(feed) {
    return $("<div>", {
        class: "feed collapsed clearfix"
    }).append(
        $("<div>", {
            class: "preview clearfix"
        }).append(
            $("<div>", {
                class: "title",
                text: feed.title
            })
        ).append(
            $("<div>", {
                class: "snippet"
            }).append(feed.contentSnippet)
        ).append(
            $("<div>", {
                class: "love top-5",
                onclick: "setLove(this, '" + convertNameToParam(feed.title) + "', !getLove('" + convertNameToParam(feed.title) + "'))"
            }).append(
                $("<i>", {
                    class: (getLove(feed.title) ? "love fa fa-heart" : "love fa fa-heart-o")
                })
            )
        ).append(
            $("<div>", {
                class: "posted-time top-5",
                text: moment(feed.publishedDate).fromNow()
            })
        ).append(
            $("<div>", {
                class: "author top-5 " + (!feed.author ? "hidden" : "")
            }).append(" " + feed.author)
        )
    ).append(
        $("<div>", {
            class: "full-content hidden"
        }).append(feed.content)
    ).on("click", function (event){
            var $this = $(this);

            if($(event.target).hasClass("love")) {
                return;
            }

            //collapse all other feeds
            $this.closest(".feed-container").find(".feed").addClass("collapsed");
            $this.closest(".feed-container").find(".snippet").removeClass("hidden");
            $this.closest(".feed-container").find(".full-content").addClass("hidden");

            $this.toggleClass("collapsed");
            $this.find(".snippet").toggleClass("hidden");
            $this.find(".full-content").toggleClass("hidden");
    });
}

function jsonpCallback(data) {
    NProgress.done();

    if(!data) {
        alert("Cannot fetch data");
    }

    var feeds = data.responseData.feed.entries;

    $(".feed-header").text(data.responseData.feed.title);

    var feedHtmlContent = [];
    feeds.forEach(function(feed){
        feedHtmlContent.push(createContentWidget(feed));
    });

    $(".feed-container").empty().append(feedHtmlContent);
}

function getFeed(event, thisFeed) {
    event.preventDefault();
    //$("#dl-menu").dlmenu('closeMenu');

    var feedUrl = $(thisFeed).data("feed-url");

    NProgress.start();

    $.ajax({
        url: "//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=10&callback=jsonpCallback&q=" + encodeURIComponent(feedUrl),
        //crossDomain: true,
        dataType: "jsonp",
        jsonp: "jsonpCallback"
    });
}

function wrapCategories(categories) {
    var menuList = $("<ul>", {
        class: "dl-menu"
    });
    for(var category in categories) {
        if(categories.hasOwnProperty(category)){
            menuList.append(
                $("<li>", {
                    class: category
                }).append(
                    $("<a>", {
                        href: "#",
                        text: category
                    })
                )
            );
            if(categories[category].length) {
                menuList.find("li." + category).append(
                    $("<ul>", {
                        class: "dl-submenu"
                    })
                );
                categories[category].forEach(function(feed) {
                    menuList.find("li." + category).find("ul.dl-submenu").append(
                        $("<li>").append(
                            $("<a>", {
                                href: "#",
                                text: feed.source,
                                "data-feed-url": feed.feed_url,
                                onclick: "getFeed(event, this)"
                            })
                        )
                    );
                });
            }
        }
    }
    return menuList;
}

function setAPICount(data) {
    data = JSON.parse(data);
    $("#api-hits").text("API Hits: " + data['api_hits']);
}

function loadFeedCategories(query) {
    NProgress.start();
    $.ajax({
        url: "http://tecnotree-7.0x10.info/api/tecnotree?type=json",
        data: {
            query: query
        },
        success: function(data) {
            NProgress.done();
            if(!data) {
                alert("No feed found");
                return;
            }

            if(query == "api_hits"){
                setAPICount(data);
                return;
            }

            var categories = {};
            data = JSON.parse(data);

            data.feed.forEach(function(feed) {
                if(!categories.hasOwnProperty(feed.category)) {
                    categories[feed.category] = [];
                }
                var source = {
                    source: feed.source,
                    feed_url: feed.feed_url
                };
                categories[feed.category].push(source);
            });
            $("#dl-menu").append(wrapCategories(categories));
            $("#dl-menu").dlmenu();
            setTimeout(function(){
                $("#dl-menu").dlmenu('openMenu');
            }, 100);
        },
        error: function (error) {
            NProgress.done();
            alert("No feed found");
        }
    });
}
