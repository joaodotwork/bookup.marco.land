remotehost  = ssh.strato.de
remotehosturl = $(remotehost)
remoteuser  = www.marco-land.com
remotedir   = /mnt/web016/d0/05/52565705/htdocs/marco-land/boockup.marco-land.com
flags = -r -t -u -z -p -P -h -i --delete
excludes = --exclude '.DS_Store'

deploy:
	@echo "\033[0;31mBuilding production assets...\033[0m"
	npm run build
	@echo "\033[0;31mBuild complete.\033[0m"
	@echo "\033[0;31mDeploying...\033[0m"
	rsync $(flags) $(excludes) dist/ $(remoteuser)@$(remotehost):$(remotedir)
	@echo "\033[0;31mDeploy complete.\033[0m"
