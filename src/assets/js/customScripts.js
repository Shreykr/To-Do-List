function openNavgationBarv1() {
    document.getElementById("sidenav").style.width = "200px";
    document.getElementById("main-content").style.marginLeft = "200px";
}
  
  function closeNavigationBarv1() {
    document.getElementById("sidenav").style.width = "0px";
  document.getElementById("main-content").style.marginLeft= "0px";
}

function openNavgationBarv2(width,height) {
  document.getElementById("sidenav").style.width = width+"px";
  document.getElementById("sidenav").style.height = height+"px";
}

function closeNavigationBarv2() {
  document.getElementById("sidenav").style.width = "0px";  
}

function destroyModal(){
  $('#projectModal').modal('hide')
}
