[![Build Status](https://dev.azure.com/veneman/Opama_open/_apis/build/status/gerardv.opama?branchName=master)](https://dev.azure.com/veneman/Opama_open/_build/latest?definitionId=5&branchName=master)
# Opama

Opama (Online Password Manager) is a .Net Core MVC web application that generates and securely stores strong passwords (and other secrets) with end-to-end encryption.
Encryption is performed client-side by the Stanford Javascript Crypto Library (https://crypto.stanford.edu/sjcl/).

## Getting Started

Opama is (currently) provided as a Visual Studio 2017 solution targeting .Net Core v2.1. [Download](https://visualstudio.microsoft.com/downloads/) and install VS 2017 from Microsoft, the Community Edition works fine.
Opama is tested on IIS, backed by a MS SQL database. In development mode, the source code uses localDb.

### Prerequisites

To just use Opama, you need access to (preferrably) an IIS server backed by a MS SQL Server. You need a database and need to know how to write a connection string to connect a .Net application to the database. You can find plenty of examples online. If you use a different web server with a .Net Core runtime or a different sql server, please let me know so I can credit you with for an additional install option.

If you want to examine or - better - enhance the source code and aid in the development of Opama, you'll need knowledge of .Net Core MVC, the Razor rendering engine, HTML, CSS and javascript.
Since the first version of Opama was written in 2013, it still uses jQuery 1.9.1 and Bootstrap 2.3.1. Other libraries used are mustache.js, modernizr (2.6.2) and off course sjcl.js as the encryption core.

### Installing

1. Create a web application using IIS manager. Make sure the SMTP settings are right so you can verify your account from the e-mail sent by the application. There's a workaround in step 4 if you're unable to setup SMTP settings in IIS.

2. Download the latest release and unzip the files in the directory you pointed the IIS application to.

3. Enter the connection string for your MS SQL Server setup in appsettings.json file in the application's root folder.

4. Point your browser to the website created in step 1, click the 'register' link, register, confirm your account (check your inbox), log in and create your first secret item. Click the 'Encrypt and store' button, sign out, sign back in and find your secret again. If you didn't receive an email or get a SMTP error when registering, open the database in SQL Server Management Studio, browse to the database and open the Users table. Find your record, set the 'disabled' field to false and clear the emailConfirmationCode field.

Do not use a non-Chromium MS Edge or Internet Explorer or expect very poor performance due to the way Edge handles the sjcl library. Because the fastest available javascript engine is the measure by which the number of encryption iterations should be set to result in a hashing time of 200ms+. For Edge this is 150, for Chrome this is 5000 or so.

### How to build and run in Docker

The application can also be run in a Docker container. The following steps provide a guideline how this can be achieved. The configuration examples uses a postfix mail and sqlserver (localdb is not support on Linux) as additional services. 

1. Clone the repository: git clone https://github.com/gerardv/opama.it opama 
   
   The repository contains a DockerFile to build the application.

2. Add a docker-compose.yml to the current directory with the following content. 

       version: "3"
         services:
           opama:
             build: opama/.
             container_name: opama
             environment:
               ConnectionStrings__DefaultConnection : "Server=db;Database=Opama;User=sa;Password={SuperSecretPassword}"
               AppSettings__SendFrom : "{EmailAddress}"
               AppSettings__MailHost : "mail"
             ports:
                 - "8000:80"
             depends_on:
               - db
               - mail
           db:
             image: "mcr.microsoft.com/mssql/server"
             container_name: sqlserver
             environment:
               SA_PASSWORD: "SuperSecretPassword"
               ACCEPT_EULA: "Y"
   
           mail:
             image: boky/postfix:latest
             container_name: opamamail
             environment:
               ALLOWED_SENDER_DOMAINS: "{MyDomain}"

3. Build the image

~~~
docker-compose build
~~~

4. And run the container

~~~
docker-compose up
~~~


## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/gerardv/opama/tags). 

## Authors

* **Gerard Veneman** - *Initial work* - [Find me on GitHub](https://github.com/gerardv) or [Stack Overflow](https://stackoverflow.com/users/796206/gerardv?tab=profile)

## Contributors

* **saschavv** [(GitHub)](https://github.com/saschavv)
   
# Want to contribute too?

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Acknowledgements

When registering, there's a password strength meter that was extracted from Dropbox back in the days. The source of this code is unknown. If you own or know who owns this code, please drop a line.
