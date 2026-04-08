#!/bin/bash
echo "Installing selfbot service..."
sed "s|YOUR_USERNAME|$USER|g" selfbot.service > /tmp/selfbot.service
sudo cp /tmp/selfbot.service /etc/systemd/system/selfbot.service
rm /tmp/selfbot.service
sudo systemctl daemon-reload
sudo systemctl enable selfbot
sudo systemctl start selfbot
echo "Done! Check status: sudo systemctl status selfbot"
