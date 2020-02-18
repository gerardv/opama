$file = 'D:\home\site\wwwroot\secrets.db'
$email = "myaccount@gmail.com"
$cc = "mysecondaryaccount@gmail.com"
$pass = "********"
$smtpServer = "smtp.gmail.com"
$backupInterval = New-Timespan -Days 1
$lastRun = (Get-Date) - $backupInterval

while($true)
{
	Write-Output("Lastrun: " + $lastRun)

	if ((Get-Date) -ge ($lastRun + $backupInterval))
	{
		Write-Output("Starting backup...")
		
		##Todo: wrap mailing in 'try catch'
		$msg = new-object Net.Mail.MailMessage 
		$smtp = new-object Net.Mail.SmtpClient($smtpServer) 
		$smtp.EnableSsl = $true 
		$msg.From = "$email"  
		$msg.To.Add("$email") 
		$msg.CC.Add("$cc")
		$msg.BodyEncoding = [system.Text.Encoding]::Unicode 
		$msg.SubjectEncoding = [system.Text.Encoding]::Unicode 
		$msg.IsBodyHTML = $true  
		$msg.Subject = "Personal password database backup"
		$msg.Attachments.Add($file)
		$msg.Body = "<h2>This is your daily database backup</h2> 
		<br /> 
		Kind regards,<br />
		Your Opama SysOps team."  
		$smtp.Credentials = New-Object System.Net.NetworkCredential("$email", $pass); 
		$smtp.Send($msg)
		
		$lastRun = Get-Date
		Write-Output("Done backing up at: " + $lastRun)
	}

	Write-Output("Sleeping for 5 minutes...")
	Start-Sleep -Seconds (60 * 5) ## Sleep 5 minutes
	Write-Output("Woke up...")
}
