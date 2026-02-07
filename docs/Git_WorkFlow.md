# PharmaStock Git Workflow

---

# Branch Roles

- jcDev = my working branch (features / tickets)
- development = integrated dev branch (team-ready)
- main = release-ready / stable

---

# Start Work on a Ticket (SCRUM-XX)

git checkout jcDev  
git pull origin jcDev  
git status  

---

# Save Work Locally (Commit Changes)

git add .  
git commit -m "SCRUM-XX: <short description>"  

Example:  
git commit -m "SCRUM-16: Configure Docker MySQL and EF Core migrations"  

---

# Push Feature Branch

git push origin jcDev  

---

# Promote to Main Dev

git checkout development  
git pull origin development  

git merge jcDev  

git push origin development  

---

# Promote to Production (Main)

git checkout main  
git pull origin main  

git merge development  

git push origin main  

---

# Sync Development Back to jcDev

git checkout jcDev  
git pull origin jcDev  

git merge development  

# Resolve conflicts if any  

git push origin jcDev  

---

# Unstage Files

git restore --staged .  

---

# Discard Local Changes (DANGER)

git restore .  

---

# Remove Last Commit (Keep Changes)

git reset --soft HEAD~1  

---

# Remove Last Commit (Delete Changes Completely) (DANGER)

git reset --hard HEAD~1  

---

# See What’s Changed

git status  
git diff  

---

# View Branches

git branch -vv  

---

# View Commit History  
(Change the 10 to see more or fewer commits)

git log --oneline --decorate --graph --all -10  

---

# Workflow Summary

1. Work in jcDev (personal dev) 
2. Commit with SCRUM ticket number  
3. Push to origin/jcDev  
4. Merge into development after feature completion (with team visibility or review).
5. Merge into main when stable (after team review and approval).


