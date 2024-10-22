
const profilePic = document.querySelector('.profile-pic');
const hoverInfo = document.querySelector('.hover-info');

profilePic.addEventListener('mouseover', () => {
    hoverInfo.style.display = 'block';
});

profilePic.addEventListener('mouseout', () => {
    hoverInfo.style.display = 'none';
});
