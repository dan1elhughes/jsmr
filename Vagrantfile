# Install Ansible on the master node.
ansible = <<EOF
add-apt-repository -y ppa:ansible/ansible
apt-get update
apt-get install -y ansible

ln -sf /vagrant/infrastructure /home/ubuntu
ln -sf /vagrant/infrastructure/hosts.ini /etc/ansible/hosts
ln -sf /vagrant/infrastructure/ansible.cfg /etc/ansible/ansible.cfg

chmod 600 /home/ubuntu/.ssh/id_rsa
EOF

# Automatically move to the infrastructure directory when booting the VM.
autoCD = <<EOF
cat << END > /home/ubuntu/.bash_aliases
rm /home/ubuntu/.ssh/known_hosts
rm /home/ubuntu/infrastructure/*.retry
cd /home/ubuntu/infrastructure
END
chown ubuntu: /home/ubuntu/.bash_aliases
EOF

# Create the pi user on worker VM.
createPi = <<EOF
useradd -m -s $(which bash) -G sudo pi
echo 'pi:raspberry' | chpasswd
EOF

Vagrant.configure("2") do |config|
	config.vm.box = "ubuntu/xenial64"
	config.vm.box_version = "20170323.0.0"

	config.vm.define "master", primary: true do |master|
		master.vm.hostname = "master"
		master.vm.network :private_network, ip: "192.168.10.10"
		master.vm.network :forwarded_port, guest: 22, host: 2200, id: "ssh"
		master.vm.provision "file", source: "~/.ssh/id_rsa", destination: "~/.ssh/id_rsa"
		master.vm.provision "file", source: "~/.ssh/id_rsa.pub", destination: "~/.ssh/id_rsa.pub"
		master.vm.provision "shell", inline: ansible
		master.vm.provision "shell", inline: autoCD
	end

	config.vm.define "pi1" do |pi|
		pi.vm.hostname = "pi1"
		pi.vm.synced_folder '.', '/vagrant', disabled: true
		pi.vm.network :private_network, ip: "192.168.10.11"
		pi.vm.network :forwarded_port, guest: 22, host: 2221, id: "ssh"
		pi.vm.provision "file", source: "~/.ssh/id_rsa.pub", destination: "/tmp/authorized_keys"
		pi.vm.provision "shell", inline: createPi
	end
end
