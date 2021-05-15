function openNavgationBarv1() {
    document.getElementById("sidenav").style.width = "200px";
    document.getElementById("main-content").style.marginLeft = "200px";
}
  
  function closeNavigationBarv1() {
    document.getElementById("sidenav").style.width = "0px";
  document.getElementById("main-content").style.marginLeft= "0px";
}

function openNavgationBarv2(width,height) {
  document.getElementById("sidenav").style.width = "200"+"px";
  document.getElementById("main-content").style.filter="blur(8px)";  
}

function closeNavigationBarv2() {
  document.getElementById("sidenav").style.width = "0px";
  document.getElementById("main-content").style.filter="";
}

function destroyModal(){
  $('#projectModal').modal('hide')

  $('#taskModal').modal('hide')

  $('#subTaskModal').modal('hide')

  $('#editItemModal').modal('hide')

  $('#searchModal').modal('hide')

  $('#notificationModal').modal('hide')

  $('#friendsModal').modal('hide')
}
