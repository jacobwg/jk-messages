function showTimeline() {
    var a = $(".incident.production").get(),
        b = $(".incident.development").get();
    a.length > 0 && renderIncidents(a), b.length > 0 && renderIncidents(b), addSpaceAtBottom(a, b)
}

function renderIncidents(a) {
    drawStraightLine($(a).first()), $.each(a, function (b) {
        var c = $(a[b]),
            d = $(a[b - 1]);
        b != 0 && (removeOverlap(c, d), setCanvasHeight(c), connectDots(c))
    })
}

function addSpaceAtBottom(a, b) {
  return;
    if ($(".timeline").length > 0 && $(".container").length > 0) {
        var c = a > 0 ? undefined : $(a).last().children("article"),
            d = b > 0 ? undefined : $(b).last().children("article"),
            e = $(".container"),
            f = c != undefined ? c.offset().top + c.height() : 0,
            g = d != undefined ? d.offset().top + d.height() : 0,
            h = e.offset().top + e.height(),
            i = 0;
        if (f >= h || g >= h) f > g ? i = f - h : i = g - h, e.height(e.height() + i)
    }
}

function drawStraightLine(a) {
    var b = a.children("canvas")[0],
        c = b.getContext("2d"),
        d = a.hasClass("production") ? 2 : 82,
        e = 16,
        f = 0;
    c.fillStyle = strokeStyle, c.fillRect(d, f, e, lineThickness)
}

function connectDots(a) {
    var b = a.find("article"),
        c = a.find("mark"),
        d = a.hasClass("production") ? "production" : "development",
        e = 20,
        f = b.position().top + 4,
        g = c.position().top + 4,
        h, i, j, k;
    canvas = a.find("canvas")[0], d == "production" ? (h = 2, i = f, j = h + e, k = g) : d == "development" && (h = 78, i = g, j = h + e, k = f), connect(h, i, j, k)
}

function connect(a, b, c, d) {
    var e = Math.abs(c - a) / 2,
        f = canvas.getContext("2d");
    f.lineWidth = lineThickness, f.strokeStyle = strokeStyle, f.beginPath(), f.moveTo(a, b), f.bezierCurveTo(a + e, b, c - e, d, c, d), f.stroke()
}

function removeOverlap(a, b) {
    if (a.length > 0 && b.length > 0) {
        var a = a.children("article"),
            b = b.children("article"),
            c = b.height(),
            d = 30;
        if (a.offset().top - d < b.offset().top + c) {
            var e = b.offset().top + c - a.offset().top + d;
            a.css("top", e + "px")
        }
    }
    return !1
}

function setCanvasHeight(a) {
    var b = a.children("article").position().top + a.find("abbr, time").position().top;
    a.children("canvas").attr("height", b)
}

function desktopView() {
    return isDesktopView = window.matchMedia("(min-width: 767px)").matches ? !0 : !1, isDesktopView
}


var canvas, strokeStyle = "#515066";
lineThickness = 1, isDesktopView = !1;
$(document).ready(function () {
    $(window).resize(function () {
        !isDesktopView && desktopView() && showTimeline()
    });

    desktopView() && showTimeline()
});