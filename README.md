# CrashPlan for Small Business log viewer

![Demo](https://raw.githubusercontent.com/SamuelBolduc/crashplan-logs/master/crashplan-logs-screenshot.png)

This is a real time log viewer for CrashPlan for Small Business made with Node.js. It behaves pretty much like the `tail` command. It displays the logs with some color to be easily readable, and tries to compute the speed of upload with the data that's available in the logs. Keep in mind there are no guarantees at all - I made this for myself and thought I should open-source it.

## Installation

`npm i -g crashplan-logs`

## Usage

```
Usage: crashplan-logs {OPTIONS} [LOGFILE]

Standard options:

   --lines, -n  Number of lines to display initially.
                Defaults to 10.

  --follow, -f  If set, monitors the file for new lines and appends them to the output.
                If unspecified, exits after showing the initial number of lines.

```

By default, the script looks in the [default CrashPlan log locations](https://support.code42.com/CrashPlan/4/Troubleshooting/Read_Code42_app_log_files#Log_file_locations). You can manually specify the log file by providing as the last argument to the command.

## Pre-requisites
This was coded with Node.js. It's not the most widely used scripting language, but that's what I'm the most comfortable with. Therefore, you will need Node.js version 4.9 or more to run this program. Head over to the [official Node.js downloads section](https://nodejs.org/en/download/) to install it if you don't already have it.

It was tested on Linux (Ubuntu 17.10) but it should also run fine on OSX and Windows (let me know if it doesn't).

My logs were produced by the Code42 6.7 application, but I don't think it differs a lot from version to version.

## Motivation

With the forced migration of CrashPlan Home users to CrashPlan for Small Business, many people were pretty disappointed with the UI of the new client compared to what they were used to. There were many issues, but what I disliked the most personnally was the removal of any relevant info about the upload progress.

In CrashPlan Home it was possible to see the upload speed and the file currently uploading, which gave a pretty good idea of what was happening. Now all we have is an overall percentage of completion as well as the "done" and "remaining" totals (rounded to the nearest unit, which in the case of terabytes is pretty vague).

This little package aims to provide some details that the standard interface does not.

## Limitations

One limitation is that the CrashPlan backup entries do not specify the seconds in their timestamp, only the minute. So for files uploading in less than 5 minutes, the speed might not be super accurate.

Also, other things that uploaded files are logged in this file. I try to ignore them, but it might happen that unexpected lines appear in the output. Don't worry, it's normal, I just didn't have the time (and knowledge) to cover all possible cases.
